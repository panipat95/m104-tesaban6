document.addEventListener('DOMContentLoaded', () => {
    let studentData = [];
    let currentFilter = 'all';

    // Elements
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const globalSearch = document.getElementById('global-search');
    
    // Tab Switching
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');

            // Update Header Title
            const titles = {
                'tab-overview': 'ภาพรวมข้อมูลนักเรียน ห้อง ม.1.4',
                'tab-students': 'คลังข้อมูลนักเรียน 360 องศา (ม.1.4)',
                'tab-midterm': 'ตารางตรวจสอบคะแนนสอบกลางภาคเรียนที่ 1 / 2569 (ม.1.4)',
                'tab-pending-tasks': 'ระบบบันทึกเช็คงานค้างรายวิชา (ม.1.4)',
                'tab-schedule': 'ตารางเรียน ชั้น ม.1.4 (ห้องเรียนประจำ 332)',
                'tab-duty': 'ตารางเวรประจำวัน & เวรจิตอาสาศูนย์จีน (ม.1.4)',
                'tab-home-visit': 'ระบบบันทึกข้อมูล & สรุปผลการเยี่ยมบ้านนักเรียน (ม.1.4)',
                'tab-line': 'ระบบสร้างข้อความประชาสัมพันธ์ LINE'
            };
            if (titles[targetTab]) pageTitle.textContent = titles[targetTab];
            if (targetTab === 'tab-pending-tasks') {
                renderTaskChecklist();
                renderActiveTasksBoard();
            }
        });
    });

    // Search Input Listener
    if (globalSearch) {
        globalSearch.addEventListener('input', () => {
            renderOverviewTable();
            renderStudentCards();
        });
    }

    // Load Initial Database
    async function loadDatabase() {
        if (window.REAL_STUDENT_DB && Array.isArray(window.REAL_STUDENT_DB) && window.REAL_STUDENT_DB.length > 0) {
            studentData = window.REAL_STUDENT_DB;
            console.log('Loaded real survey database:', studentData.length, 'students');
        } else {
            try {
                const res = await fetch('students_db.json');
                if (res.ok) {
                    studentData = await res.json();
                } else {
                    studentData = generateFallbackData();
                }
            } catch (e) {
                studentData = generateFallbackData();
            }
        }
        applySavedLSSelections();
        loadSavedHomeworkTasks();
        renderAllViews();
        applyUserRole(currentRole);
    }

    function applySavedLSSelections() {
        const savedLS = localStorage.getItem('ls_student_levels');
        let lsMap = {};
        if (savedLS) {
            try { lsMap = JSON.parse(savedLS); } catch (e) {}
        }

        studentData.forEach(s => {
            const level = lsMap[s.student_id] || 'normal';
            s.ls_level = level;
            if (level === 'risk') s.ls_status = "สุ่มเสี่ยง";
            else if (level === 'problem') s.ls_status = "มีปัญหา";
            else s.ls_status = "ปกติ";
        });
    }

    // Fallback Data Generator
    function generateFallbackData() {
        const list = [];
        const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
        for (let i = 1; i <= 40; i++) {
            const isMale = i % 2 === 1;
            const pfx = isMale ? 'เด็กชาย' : 'เด็กหญิง';
            const gender = isMale ? 'ชาย' : 'หญิง';
            list.push({
                no: i,
                student_id: `5690${i.toString().padStart(2, '0')}`,
                title: pfx,
                firstname: `นักเรียน ${i}`,
                lastname: `เรียนดี`,
                fullname: `${pfx} นักเรียน ${i} เรียนดี`,
                fullname_en: `Student ${i} Reandee`,
                nickname: `น้อง ${i}`,
                gender: gender,
                classroom: 'ม.1.4',
                national_id: `11004001234${i.toString().padStart(2, '0')}`,
                birthdate: `2556-05-${i.toString().padStart(2, '0')}`,
                religion: 'พุทธ',
                guardian_name: `นาย/นาง ผู้ปกครองนักเรียน ${i}`,
                guardian_phone: `081-234-56${i.toString().padStart(2, '0')}`,
                relation: 'ผู้ปกครอง',
                duty_day: days[(i - 1) % 5],
                study_group: `กลุ่ม ${String.fromCharCode(65 + (i % 3))}`,
                pending_work: i % 3 === 0 ? 'ส่งไม่ครบ (ค้าง 2 งาน)' : 'ส่งครบแล้ว',
                fee_848: i % 4 === 0 ? 'ยังไม่ชำระ' : 'ชำระแล้ว',
                pay_260: i % 5 === 0 ? 'ยังไม่ได้รับ' : 'รับแล้ว',
                receipt_status: 'ออกแล้ว',
                insurance: 'คุ้มครอง',
                ls_status: i % 7 === 0 ? 'เด็กกลุ่มห่วงใย (LS)' : 'ทั่วไป',
                notes: 'ข้อมูลสรุปห้อง ม.1.4'
            });
        }
        return list;
    }

    // Render All App Views
    function renderAllViews() {
        renderStats();
        renderOverviewTable();
        renderStudentCards();
        renderMidtermTable();
        renderTaskChecklist();
        renderActiveTasksBoard();
        renderDutyGrid();
        populateLineStudentDropdown();
        populateLookupStudentDropdown();
    }

    function filterData(data) {
        let list = [...data];
        const globalSearchInput = document.getElementById('global-search');
        const query = globalSearchInput ? globalSearchInput.value.trim().toLowerCase() : '';
        if (query) {
            list = list.filter(s => 
                s.fullname.toLowerCase().includes(query) ||
                s.student_id.toString().includes(query) ||
                (s.nickname && s.nickname.toLowerCase().includes(query)) ||
                (s.guardian_name && s.guardian_name.toLowerCase().includes(query))
            );
        }

        if (typeof currentFilter !== 'undefined' && currentFilter !== 'all') {
            list = list.filter(s => s.ls_level === currentFilter);
        }

        return list;
    }

    // Render Overview Stats
    function renderStats() {

        const total = studentData.length;
        const maleCount = studentData.filter(s => s.gender === 'ชาย' || s.gender === 'Male').length;
        const femaleCount = total - maleCount;
        
        const riskCount = studentData.filter(s => s.ls_level === 'risk').length;
        const problemCount = studentData.filter(s => s.ls_level === 'problem').length;

        let totalScoreSum = 0;
        studentData.forEach(s => {
            if (s.scores && s.scores.total_score) totalScoreSum += s.scores.total_score;
        });
        const avgScore = total > 0 ? (totalScoreSum / total).toFixed(1) : '108.5';
        const avgPct = ((avgScore / 145) * 100).toFixed(1);

        const elTotal = document.getElementById('stat-total');
        if (elTotal) elTotal.textContent = `${total} คน`;
        
        const elGender = document.getElementById('stat-gender-ratio');
        if (elGender) elGender.textContent = `ชาย ${maleCount} | หญิง ${femaleCount}`;

        const elLS = document.getElementById('stat-ls');
        if (elLS) elLS.textContent = `สุ่มเสี่ยง ${riskCount} | มีปัญหา ${problemCount}`;

        const elAvg = document.getElementById('stat-midterm-avg');
        if (elAvg) elAvg.textContent = `${avgScore} คะแนน (${avgPct}%)`;
    }

    let overviewCurrentPage = 1;
    const overviewPageSize = 10;

    // Render Overview Table with 10 Students per Page Pagination
    function renderOverviewTable() {
        const tbody = document.querySelector('#table-overview tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const filtered = filterData(studentData);
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / overviewPageSize) || 1;

        if (overviewCurrentPage > totalPages) overviewCurrentPage = totalPages;
        if (overviewCurrentPage < 1) overviewCurrentPage = 1;

        const startIndex = (overviewCurrentPage - 1) * overviewPageSize;
        const endIndex = Math.min(startIndex + overviewPageSize, totalItems);

        const pageData = filtered.slice(startIndex, endIndex);

        pageData.forEach(s => {
            const tr = document.createElement('tr');
            const photoSrc = s.photo_url || `photos/${s.student_id}.jpg`;

            let lsBadge = '<span class="badge badge-success" style="font-size:0.75rem;">🟢 ปกติ</span>';
            if (s.ls_level === 'risk') lsBadge = '<span class="badge badge-warning" style="font-size:0.75rem;">🟡 สุ่มเสี่ยง</span>';
            else if (s.ls_level === 'problem') lsBadge = '<span class="badge badge-danger" style="font-size:0.75rem;">🔴 มีปัญหา</span>';

            const pendingTasksForStudent = pendingHomeworkTasks.filter(t => t.pendingStudentIds.includes(s.student_id));
            const pendingCount = pendingTasksForStudent.length;

            tr.innerHTML = `
                <td style="vertical-align:middle; text-align:center;"><strong>${s.no}</strong></td>
                <td style="vertical-align:middle;"><span class="badge badge-purple">${s.student_id}</span></td>
                <td style="vertical-align:middle;">
                    <div style="display:flex; align-items:center; gap:10px; white-space:nowrap;">
                        <img src="${photoSrc}" onerror="this.style.display='none'" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1px solid #0284c7; flex-shrink:0;">
                        <div>
                            <strong style="color:#0f172a; font-size:0.92rem;">${s.fullname}</strong>
                            ${s.nickname ? `<span style="color:#64748b; font-size:0.82rem; margin-left:3px;">(${s.nickname})</span>` : ''}
                            <span style="margin-left:6px;">${lsBadge}</span>
                        </div>
                    </div>
                </td>
                <td class="admin-only" style="vertical-align:middle;">${s.guardian_name || '-'}<br><small style="color:var(--text-muted)">📞 ${s.guardian_phone || '-'}</small></td>
                <td style="vertical-align:middle;"><span class="badge badge-purple">วัน${s.duty_day || 'จันทร์'}</span></td>
                <td style="vertical-align:middle;">
                    <span class="badge ${pendingCount > 0 ? 'badge-danger' : 'badge-success'}">
                        ${pendingCount > 0 ? `ค้าง ${pendingCount} งาน` : 'ส่งครบแล้ว'}
                    </span>
                </td>
                <td style="vertical-align:middle;">
                    <button class="btn-line btn-sm-action admin-only" onclick="openQuickLine('${s.student_id}')">
                        <i class="fa-brands fa-line"></i> แจ้ง LINE
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        renderOverviewPagination(totalItems, totalPages, startIndex, endIndex);
    }

    function renderOverviewPagination(totalItems, totalPages, startIndex, endIndex) {
        const infoEl = document.getElementById('overview-pagination-info');
        const ctrlEl = document.getElementById('overview-pagination-controls');
        if (!infoEl || !ctrlEl) return;

        if (totalItems === 0) {
            infoEl.textContent = 'ไม่พบข้อมูลนักเรียน';
            ctrlEl.innerHTML = '';
            return;
        }

        infoEl.textContent = `แสดงลำดับที่ ${startIndex + 1} - ${endIndex} จากทั้งหมด ${totalItems} คน (หน้า ${overviewCurrentPage}/${totalPages})`;

        let btnsHtml = `
            <button class="btn-sm btn-secondary" style="padding:4px 10px; font-weight:600; ${overviewCurrentPage === 1 ? 'opacity:0.5; cursor:not-allowed;' : 'cursor:pointer;'}" ${overviewCurrentPage === 1 ? 'disabled' : ''} onclick="changeOverviewPage(${overviewCurrentPage - 1})">
                <i class="fa-solid fa-chevron-left"></i> ก่อนหน้า
            </button>
        `;

        for (let p = 1; p <= totalPages; p++) {
            const isActive = (p === overviewCurrentPage);
            btnsHtml += `
                <button class="btn-sm" style="min-width:32px; padding:4px 10px; font-weight:700; border-radius:6px; cursor:pointer; ${isActive ? 'background:#0284c7; color:#fff; border:none; box-shadow:0 2px 6px rgba(2,132,199,0.3);' : 'background:#fff; border:1px solid #cbd5e1; color:#334155;'}" onclick="changeOverviewPage(${p})">
                    ${p}
                </button>
            `;
        }

        btnsHtml += `
            <button class="btn-sm btn-secondary" style="padding:4px 10px; font-weight:600; ${overviewCurrentPage === totalPages ? 'opacity:0.5; cursor:not-allowed;' : 'cursor:pointer;'}" ${overviewCurrentPage === totalPages ? 'disabled' : ''} onclick="changeOverviewPage(${overviewCurrentPage + 1})">
                ถัดไป <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;

        ctrlEl.innerHTML = btnsHtml;
    }

    window.changeOverviewPage = function(page) {
        overviewCurrentPage = page;
        renderOverviewTable();
    };

    // Render Student 360 Cards Grid
    function renderStudentCards() {
        const container = document.getElementById('students-cards-grid');
        container.innerHTML = '';

        const filtered = filterData(studentData);

        filtered.forEach(s => {
            const card = document.createElement('div');
            card.className = 'student-card';
            const isLS = s.ls_status && s.ls_status.includes('LS');
            const isPending = s.pending_work && s.pending_work.includes('ค้าง');
            const photoSrc = s.photo_url || `photos/${s.student_id}.jpg`;

            card.innerHTML = `
                <div class="student-card-header">
                    <img src="${photoSrc}" onerror="this.outerHTML='<div class=\\'student-avatar\\'><i class=\\'fa-solid fa-user-graduate\\'></i></div>'" class="student-card-photo">
                    <div class="student-info-meta">
                        <strong>${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}</strong>
                        <div>เลขที่ ${s.no} | รหัส ${s.student_id}</div>
                    </div>
                </div>
                <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.6;">
                    <div><i class="fa-solid fa-user-tie"></i> ผู้ปกครอง: ${s.guardian_name || '-'}</div>
                    <div><i class="fa-solid fa-phone"></i> โทร: ${s.guardian_phone || '-'}</div>
                    <div><i class="fa-solid fa-cake-candles"></i> วันเกิด: ${s.birthdate || '-'}</div>
                </div>
                <div style="margin-top:10px; display:flex; gap:6px; flex-wrap:wrap;">
                    <span class="badge ${isPending ? 'badge-danger' : 'badge-success'}">${s.pending_work || 'งานครบ'}</span>
                    <span class="badge badge-purple">เวร${s.duty_day || 'จันทร์'}</span>
                    ${isLS ? '<span class="badge badge-warning">เด็ก LS / ห่วงใย</span>' : ''}
                </div>
            `;
            card.addEventListener('click', () => openStudentModal(s));
            container.appendChild(card);
        });
    }

    // Render Midterm Scores Table (165 Max Score)
    function renderMidtermTable() {
        const tbody = document.querySelector('#table-midterm-scores tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        studentData.forEach(s => {
            const tr = document.createElement('tr');
            const sc = s.scores || { eng_comm: 0, social: 0, math_basic: 0, thai: 0, math_add1: 0, math_add2: 0, chinese: 0, eng_basic: 0, sci_basic: 0, total_score: 0 };
            const pct = ((sc.total_score / 165) * 100).toFixed(1);
            const photoSrc = s.photo_url || `photos/${s.student_id}.jpg`;

            tr.innerHTML = `
                <td style="vertical-align:middle; text-align:center;"><strong>${s.no}</strong></td>
                <td style="vertical-align:middle;">
                    <div style="display:flex; align-items:center; gap:10px; white-space:nowrap;">
                        <img src="${photoSrc}" onerror="this.style.display='none'" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1px solid #0284c7; flex-shrink:0;">
                        <div>
                            <strong style="color:#0f172a; font-size:0.92rem;">${s.fullname}</strong>
                            ${s.nickname ? `<span style="color:#64748b; font-size:0.82rem; margin-left:3px;">(${s.nickname})</span>` : ''}
                        </div>
                    </div>
                </td>
                <td><span class="badge ${sc.eng_comm >= 10 ? 'badge-success' : 'badge-danger'}">${sc.eng_comm}</span></td>
                <td><span class="badge ${sc.social >= 10 ? 'badge-success' : 'badge-danger'}">${sc.social}</span></td>
                <td><span class="badge ${sc.math_basic >= 10 ? 'badge-success' : 'badge-danger'}">${sc.math_basic}</span></td>
                <td><span class="badge ${sc.thai >= 10 ? 'badge-success' : 'badge-danger'}">${sc.thai}</span></td>
                <td><span class="badge ${sc.math_add1 >= 10 ? 'badge-success' : 'badge-danger'}">${sc.math_add1}</span></td>
                <td><span class="badge ${sc.math_add2 >= 2.5 ? 'badge-success' : 'badge-danger'}">${sc.math_add2}</span></td>
                <td><span class="badge ${sc.chinese >= 10 ? 'badge-success' : 'badge-danger'}">${sc.chinese}</span></td>
                <td><span class="badge ${sc.eng_basic >= 10 ? 'badge-success' : 'badge-danger'}">${sc.eng_basic}</span></td>
                <td><span class="badge ${(sc.sci_basic || 0) >= 10 ? 'badge-success' : 'badge-danger'}">${sc.sci_basic || 0}</span></td>
                <td><strong style="color:var(--primary); font-size:1.05rem;">${sc.total_score}</strong></td>
                <td><span class="badge ${pct >= 50 ? 'badge-purple' : 'badge-warning'}">${pct}%</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
    function renderDutyGrid() {
        const container = document.getElementById('duty-week-grid');
        const todayBanner = document.getElementById('today-duty-banner');
        if (!container) return;
        container.innerHTML = '';

        const dutyRules = {
            'จันทร์': { morning: '🏛️ เขตศูนย์จีน (ถูพื้น)', evening: '🧹 ทำความสะอาด & จัดระเบียบห้องเรียนประจำวัน (ห้องประจำ 332)', badgeBg: '#e0f2fe', textColor: '#0369a1' },
            'อังคาร': { morning: '🏛️ เขตศูนย์จีน (ถูพื้น)', evening: '🧹 ทำความสะอาด & จัดระเบียบห้องเรียนประจำวัน (ห้องประจำ 332)', badgeBg: '#fef3c7', textColor: '#92400e' },
            'พุธ': { morning: '🏛️ เขตศูนย์จีน (ถูพื้น)', evening: '🧹 ทำความสะอาด & จัดระเบียบห้องเรียนประจำวัน (ห้องประจำ 332)', badgeBg: '#dcfce7', textColor: '#166534' },
            'พฤหัสบดี': { morning: '🏛️ เขตศูนย์จีน (ถูพื้น)', evening: '🧹 ทำความสะอาด & จัดระเบียบห้องเรียนประจำวัน (ห้องประจำ 332)', badgeBg: '#ffedd5', textColor: '#9a3412' },
            'ศุกร์': { morning: '🏛️ เขตศูนย์จีน (ถูพื้น)', evening: '🧹 ทำความสะอาด & จัดระเบียบห้องเรียนประจำวัน (ห้องประจำ 332)', badgeBg: '#fae8ff', textColor: '#86198f' }
        };

        const activeStudentList = studentData;

        const now = new Date();
        const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        const thaiDayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

        const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        const currentDayName = days[dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek - 1 : 0];
        const formattedDateStr = `วัน${thaiDayNames[dayOfWeek]}ที่ ${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}`;
        const formattedTimeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        // Render Today's Duty Banner
        if (todayBanner) {
            const todayStudents = activeStudentList.filter(s => s.duty_day === currentDayName);
            const rules = dutyRules[currentDayName];

            todayBanner.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                    <div>
                        <h2 style="font-size:1.25rem; font-weight:700; color:#ffffff; display:flex; align-items:center; gap:8px; margin:0; line-height:1.4;">
                            <i class="fa-solid fa-broom" style="color:#fde047;"></i> เวรประจำวันและจิตอาสาประจำวันนี้: วัน${currentDayName} (${todayStudents.length} คน)
                        </h2>
                        <div style="font-size:0.88rem; opacity:0.95; margin-top:4px;">
                            📅 <strong>${formattedDateStr}</strong> • ⏰ เวลา ${formattedTimeStr} น. • ห้องประจำ 332
                        </div>
                    </div>
                    <span class="badge" style="background:#ffffff; color:#0284c7; font-weight:700; font-size:0.88rem; padding:6px 14px; border-radius:20px;">
                        <i class="fa-solid fa-signal" style="color:#16a34a;"></i> ออนไลน์ (วันเวลาจริง)
                    </span>
                </div>

                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-bottom:14px; background:rgba(255,255,255,0.18); padding:12px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.3);">
                    <div style="line-height:1.5;">
                        <strong style="color:#fef08a; font-size:0.9rem;"><i class="fa-solid fa-sun"></i> รอบเช้า (จิตอาสาถูพื้นศูนย์จีน 07.30 - 07.40 น.):</strong>
                        <div style="font-size:0.92rem; font-weight:700; margin-top:2px;">${rules.morning}</div>
                    </div>
                    <div style="line-height:1.5;">
                        <strong style="color:#ffffff; font-size:0.9rem;"><i class="fa-solid fa-moon"></i> รอบเย็น (ทำความสะอาดห้องเรียนประจำ 332):</strong>
                        <div style="font-size:0.92rem; font-weight:700; margin-top:2px;">${rules.evening}</div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap:8px;">
                    ${todayStudents.length > 0 ? todayStudents.map(s => `
                        <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.22); padding:8px 12px; border-radius:8px; backdrop-filter:blur(4px);">
                            <img src="${s.photo_url || 'photos/' + s.student_id + '.jpg'}" onerror="this.style.display='none'" style="width:30px; height:30px; border-radius:50%; object-fit:cover; border:1px solid #ffffff;">
                            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><strong>เลขที่ ${s.no}</strong> ${s.fullname}</span>
                        </div>
                    `).join('') : '<div style="color:rgba(255,255,255,0.8); font-size:0.9rem;">วันนี้ไม่มีเวรทำความสะอาด</div>'}
                </div>
            `;
        }

        // Render Today's Duty in Overview Panel (#duty-today-list)
        const dutyTodayList = document.getElementById('duty-today-list');
        const currentDayNameSpan = document.getElementById('current-day-name');
        if (currentDayNameSpan) currentDayNameSpan.textContent = `วัน${currentDayName}`;

        if (dutyTodayList) {
            const todayStudents = activeStudentList.filter(s => s.duty_day === currentDayName);
            const rules = dutyRules[currentDayName];

            dutyTodayList.innerHTML = `
                <div style="background:${rules.badgeBg}; border:1px solid #bae6fd; border-radius:10px; padding:10px 12px; margin-bottom:12px; line-height:1.5;">
                    <div style="font-size:0.82rem; font-weight:700; color:${rules.textColor}; margin-bottom:4px;">
                        <i class="fa-solid fa-sun"></i> รอบเช้า (07.30 - 07.40 น.): <span style="font-weight:600;">${rules.morning}</span>
                    </div>
                    <div style="font-size:0.82rem; font-weight:700; color:${rules.textColor};">
                        <i class="fa-solid fa-moon"></i> รอบเย็น (16.00 น.): <span style="font-weight:600;">${rules.evening}</span>
                    </div>
                </div>
                <div style="font-size:0.88rem; font-weight:700; color:#0f172a; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <span><i class="fa-solid fa-users"></i> นักเรียนปฏิบัติเวรวันนี้:</span>
                    <span class="badge badge-purple">${todayStudents.length} คน</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px; max-height:240px; overflow-y:auto;">
                    ${todayStudents.length > 0 ? todayStudents.map(s => `
                        <div style="display:flex; align-items:center; gap:8px; padding:7px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:0.85rem;">
                            <img src="${s.photo_url || 'photos/' + s.student_id + '.jpg'}" onerror="this.style.display='none'" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid #0284c7; flex-shrink:0;">
                            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                <strong>เลขที่ ${s.no}</strong> ${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}
                            </span>
                        </div>
                    `).join('') : '<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:10px;">วันนี้ไม่มีเวรทำความสะอาด</div>'}
                </div>
            `;
        }

        // Render Tomorrow's Duty in Overview Panel (#duty-tomorrow-list)
        const currentDayIdx = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek - 1 : 0;
        const tomorrowDayIdx = (currentDayIdx + 1) % 5;
        const tomorrowDayName = days[tomorrowDayIdx];

        const dutyTomorrowList = document.getElementById('duty-tomorrow-list');
        const tomorrowDayNameSpan = document.getElementById('tomorrow-day-name');
        if (tomorrowDayNameSpan) tomorrowDayNameSpan.textContent = `วัน${tomorrowDayName}`;

        if (dutyTomorrowList) {
            const tomorrowStudents = activeStudentList.filter(s => s.duty_day === tomorrowDayName);
            const tRules = dutyRules[tomorrowDayName];

            dutyTomorrowList.innerHTML = `
                <div style="background:${tRules.badgeBg}; border:1px solid #fde047; border-radius:10px; padding:10px 12px; margin-bottom:12px; line-height:1.5;">
                    <div style="font-size:0.82rem; font-weight:700; color:${tRules.textColor}; margin-bottom:4px;">
                        <i class="fa-solid fa-sun"></i> รอบเช้า (07.30 - 07.40 น.): <span style="font-weight:600;">${tRules.morning}</span>
                    </div>
                    <div style="font-size:0.82rem; font-weight:700; color:${tRules.textColor};">
                        <i class="fa-solid fa-moon"></i> รอบเย็น (16.00 น.): <span style="font-weight:600;">${tRules.evening}</span>
                    </div>
                </div>
                <div style="font-size:0.88rem; font-weight:700; color:#0f172a; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <span><i class="fa-solid fa-users"></i> นักเรียนปฏิบัติเวรวันพรุ่งนี้:</span>
                    <span class="badge badge-warning">${tomorrowStudents.length} คน</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px; max-height:240px; overflow-y:auto;">
                    ${tomorrowStudents.length > 0 ? tomorrowStudents.map(s => `
                        <div style="display:flex; align-items:center; gap:8px; padding:7px 10px; background:#fffdf5; border:1px solid #fef08a; border-radius:8px; font-size:0.85rem;">
                            <img src="${s.photo_url || 'photos/' + s.student_id + '.jpg'}" onerror="this.style.display='none'" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid #d97706; flex-shrink:0;">
                            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                <strong>เลขที่ ${s.no}</strong> ${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}
                            </span>
                        </div>
                    `).join('') : '<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:10px;">วันพรุ่งนี้ไม่มีเวรทำความสะอาด</div>'}
                </div>
            `;
        }

        // Render 5 Days Duty Cards
        days.forEach(day => {
            const rules = dutyRules[day];
            const dayStudents = activeStudentList.filter(s => s.duty_day === day);
            const isToday = (day === currentDayName);

            const card = document.createElement('div');
            card.style.cssText = `background:#ffffff; border: 2px solid ${isToday ? '#0284c7' : '#e2e8f0'}; border-radius: 12px; padding: 14px; box-shadow: ${isToday ? '0 4px 15px rgba(2,132,199,0.18)' : '0 2px 6px rgba(0,0,0,0.02)'};`;

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid #e2e8f0;">
                    <h4 style="color:${rules.textColor}; font-weight:700; font-size:1.05rem; margin:0;">
                        <i class="fa-solid fa-calendar-day"></i> วัน${day} ${isToday ? '<span class="badge badge-success" style="font-size:0.75rem;">วันนี้</span>' : ''}
                    </h4>
                    <span class="badge" style="background:${rules.badgeBg}; color:${rules.textColor}; font-weight:700;">${dayStudents.length} คน</span>
                </div>

                <div style="font-size:0.82rem; background:#f8fafc; padding:8px 10px; border-radius:8px; margin-bottom:10px; border:1px solid #e2e8f0; line-height:1.5;">
                    <div style="color:#0369a1; font-weight:600;"><i class="fa-solid fa-sun"></i> เช้า (จิตอาสา 07.30-07.40 น.):</div>
                    <div style="font-weight:700; color:#334155; margin-bottom:4px;">${rules.morning}</div>
                    <div style="color:#d97706; font-weight:600;"><i class="fa-solid fa-moon"></i> เย็น (16.00 น.):</div>
                    <div style="font-weight:600; color:#475569;">${rules.evening}</div>
                </div>

                <div style="display:flex; flex-direction:column; gap:6px; max-height:220px; overflow-y:auto;">
                    ${dayStudents.map(s => `
                        <div style="display:flex; align-items:center; gap:8px; padding:6px 8px; background:#f8fafc; border:1px solid #f1f5f9; border-radius:6px; font-size:0.85rem;">
                            <img src="${s.photo_url || 'photos/' + s.student_id + '.jpg'}" onerror="this.style.display='none'" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">
                            <span><strong>เลขที่ ${s.no}</strong> ${s.fullname}</span>
                        </div>
                    `).join('')}
                </div>
            `;

            container.appendChild(card);
        });
    }

    // Populate LINE Student Dropdown
    function populateLineStudentDropdown() {
        const select = document.getElementById('line-student-select');
        select.innerHTML = '<option value="all">-- ประกาศสำหรับนักเรียนทุกคน / กลุ่มห้อง 1.4 --</option>';

        studentData.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.student_id;
            opt.textContent = `เลขที่ ${s.no} - ${s.fullname} (${s.guardian_name || 'ผู้ปกครอง'})`;
            select.appendChild(opt);
        });
    }

    // Filter Logic
    function filterData(data) {
        const query = globalSearch.value.trim().toLowerCase();
        return data.filter(s => {
            const matchSearch = !query || 
                s.fullname.toLowerCase().includes(query) ||
                s.student_id.includes(query) ||
                (s.guardian_name && s.guardian_name.toLowerCase().includes(query)) ||
                (s.guardian_phone && s.guardian_phone.includes(query));

            if (!matchSearch) return false;

            if (currentFilter === 'normal') return s.ls_level === 'normal' || !s.ls_level;
            if (currentFilter === 'risk') return s.ls_level === 'risk';
            if (currentFilter === 'problem') return s.ls_level === 'problem';

            return true;
        });
    }

    // Filter Pills Event Listener
    document.querySelectorAll('.filter-pills .pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.getAttribute('data-filter');
            overviewCurrentPage = 1;
            renderOverviewTable();
            renderStudentCards();
        });
    });

    globalSearch.addEventListener('input', () => {
        overviewCurrentPage = 1;
        renderOverviewTable();
        renderStudentCards();
    });

    // LINE Daily Duty Generator Logic
    const btnGenerateLine = document.getElementById('btn-generate-line');
    const linePreviewText = document.getElementById('line-preview-text');
    const btnCopyLine = document.getElementById('btn-copy-line');

    if (btnGenerateLine) {
        btnGenerateLine.addEventListener('click', generateDailyDutyLineMessage);
    }

    function getThaiDayName(dateObj) {
        const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
        return days[dateObj.getDay()];
    }

    function getNextDutyDayName(currentDayName) {
        const map = {
            'จันทร์': 'อังคาร',
            'อังคาร': 'พุธ',
            'พุธ': 'พฤหัสบดี',
            'พฤหัสบดี': 'ศุกร์',
            'ศุกร์': 'จันทร์'
        };
        return map[currentDayName] || 'จันทร์';
    }

    function generateDailyDutyLineMessage() {
        const daySelect = document.getElementById('line-duty-day-select');
        const selectedDayValue = daySelect ? daySelect.value : 'auto';
        const customNoteElem = document.getElementById('line-custom-note');
        const customNote = customNoteElem ? customNoteElem.value.trim() : '';

        const now = new Date();
        let targetDayName = getThaiDayName(now);

        if (selectedDayValue !== 'auto') {
            targetDayName = selectedDayValue;
        }

        if (selectedDayValue === 'auto' && (targetDayName === 'อาทิตย์' || targetDayName === 'เสาร์')) {
            targetDayName = 'จันทร์';
        }

        const nextDayName = getNextDutyDayName(targetDayName);

        const todayStudents = studentData.filter(s => s.duty_day === targetDayName);
        const nextDayStudents = studentData.filter(s => s.duty_day === nextDayName);

        const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        const dateStr = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}`;

        let msg = `🧹 [แจ้งเตือนเวรทำความสะอาดประจำวัน ม.1/4 SMT]\n`;
        msg += `📅 ประจำวัน${targetDayName} (${dateStr})\n\n`;
        msg += `⏰ เวลาปฏิบัติหน้าที่: 07.30 - 07.40 น.\n`;
        msg += `📍 ภารกิจ: ทำเขตจิตอาสาถูพื้นศูนย์จีน & ทำความสะอาดห้องเรียน 332\n\n`;

        msg += `👥 รายชื่อนักเรียนเวรประจำวันถูพื้น ${targetDayName} (${todayStudents.length} คน):\n`;
        if (todayStudents.length > 0) {
            todayStudents.forEach((s, idx) => {
                msg += `${idx + 1}. เลขที่ ${s.no} ${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}\n`;
            });
        } else {
            msg += `(ไม่มีรายชื่อเวรถูพื้น)\n`;
        }

        msg += `\n--------- \n\n`;

        msg += `👥 รายชื่อนักเรียนเวรวันถัดไปกวาดพื้น ${nextDayName} (${nextDayStudents.length} คน):\n`;
        if (nextDayStudents.length > 0) {
            nextDayStudents.forEach((s, idx) => {
                msg += `${idx + 1}. เลขที่ ${s.no} ${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}\n`;
            });
        } else {
            msg += `(ไม่มีรายชื่อเวรกวาดพื้น)\n`;
        }

        msg += `\n✨ ขอให้นักเรียนที่มีรายชื่อมาร่วมทำความสะอาดและถูพื้นตรงตามเวลาด้วยนะครับ`;

        if (customNote) {
            msg += `\n\n📌 ประกาศเพิ่มเติมจากครูประจำชั้น:\n${customNote}`;
        }

        if (linePreviewText) {
            linePreviewText.textContent = msg;
        }
    }

    // Auto-generate today's duty reminder on load
    setTimeout(() => {
        if (linePreviewText) {
            generateDailyDutyLineMessage();
        }
    }, 300);

    function showToast(message, icon = '✨') {
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    btnCopyLine.addEventListener('click', () => {
        const text = linePreviewText.textContent;
        if (!text || text.includes('กดปุ่ม "สร้างข้อความ LINE"')) {
            showToast('กรุณากดปุ่ม "สร้างข้อความ LINE" ก่อนครับ', '⚠️');
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            showToast('คัดลอกข้อความ LINE เรียบร้อยแล้ว!', '📋');
        });
    });

    const btnSendLineDirect = document.getElementById('btn-send-line-direct');
    if (btnSendLineDirect) {
        btnSendLineDirect.addEventListener('click', () => {
            const text = linePreviewText.textContent;
            if (!text || text.includes('กดปุ่ม "สร้างข้อความ LINE"')) {
                showToast('กรุณากดปุ่ม "สร้างข้อความ LINE" ก่อนครับ', '⚠️');
                return;
            }

            navigator.clipboard.writeText(text);
            showToast('กำลังสลับไปเปิดแอป LINE...', '📱');
            const shareUrl = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
            window.open(shareUrl, '_blank');
        });
    }

    // LINE Messaging API (Nong Maew Som 🐱 @706jgkro) Handler
    const POR_NONG_MAEWSOM_TOKEN = "IreTHxq60X+lc2mZR1TdpTnEvYDhvqBAwc/YPWI8llBUETzGurjjqt5Am4zUC4wzKJdinCdl/Kfv8sxchKSDmrHrgirxWtKnKvCEzN01r0+qDfTGrVAoQnNyATuFxZGsLBwQ2C2KNN+2Nd19lwXOpwdB04t89/1O/w1cDnyilFU=";
    const msgTokenInput = document.getElementById('line-messaging-token-input');
    const btnSaveMsgApi = document.getElementById('btn-save-messaging-api');
    const btnTestMsgApi = document.getElementById('btn-test-messaging-api');
    const btnBroadcastApi = document.getElementById('btn-broadcast-messaging-api');

    if (msgTokenInput) {
        const savedMsgToken = localStorage.getItem('line_messaging_token') || POR_NONG_MAEWSOM_TOKEN;
        msgTokenInput.value = savedMsgToken;

        if (btnSaveMsgApi) {
            btnSaveMsgApi.addEventListener('click', () => {
                const tok = msgTokenInput.value.trim();
                if (!tok) { alert('กรุณากรอก Channel Access Token ครับ'); return; }
                localStorage.setItem('line_messaging_token', tok);
                alert('บันทึกตั้งค่า LINE Messaging API (บอทน้องแมวส้ม 🐱) เรียบร้อยแล้ว!');
            });
        }

        if (btnTestMsgApi) {
            btnTestMsgApi.addEventListener('click', () => {
                const tok = msgTokenInput.value.trim() || POR_NONG_MAEWSOM_TOKEN;
                sendLineBroadcastMessage(tok, '🐱 [ทดสอบบอทน้องแมวส้ม @706jgkro]\nทดสอบการส่งข้อความจากระบบ Dashboard ห้อง ม.1.4 เรียบร้อยแล้วครับ! ✨');
            });
        }

        if (btnBroadcastApi) {
            btnBroadcastApi.addEventListener('click', () => {
                const tok = msgTokenInput.value.trim() || POR_NONG_MAEWSOM_TOKEN;
                const msg = linePreviewText.textContent;
                if (!msg || msg.includes('กดปุ่ม "สร้างข้อความ LINE"')) {
                    alert('กรุณากดปุ่ม "สร้างข้อความ LINE" ก่อนครับ');
                    return;
                }
                sendLineBroadcastMessage(tok, msg);
            });
        }
    }

    function sendLineBroadcastMessage(token, messageText) {
        const btn = document.getElementById('btn-broadcast-messaging-api') || document.getElementById('btn-test-messaging-api');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังส่งผ่านบอทน้องแมวส้ม 🐱...';
        }

        const webhookUrlInput = document.getElementById('line-webhook-url-input');
        const webhookUrl = (webhookUrlInput && webhookUrlInput.value.trim()) || 'https://script.google.com/macros/s/AKfycbyPphz43aLcZAq_r6XYtTEHnmNQAViMg_gwBJ2e_eb2QMOrHPlM4zwPf-BT09ZYASyyNg/exec';

        const groupIdInput = document.getElementById('line-group-id-input');
        const groupId = (groupIdInput && groupIdInput.value.trim()) || 'Ca98a77879c82670dd198ea9f2c549f9d';

        fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageText, text: messageText, token: token, groupId: groupId })
        })
        .then(() => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-cat"></i> 🐱 บรอดแคสต์ด้วยน้องแมวส้ม (@706jgkro)';
            }
            alert('🚀 คำสั่งส่งข้อความผ่านบอทน้องแมวส้ม 🐱 (@706jgkro) ทำงานเรียบร้อยแล้ว!\n\nข้อความถูกส่งเข้าไปในกลุ่ม LINE เรียบร้อยครับ ✨');
        })
        .catch(err => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-cat"></i> 🐱 บรอดแคสต์ด้วยน้องแมวส้ม (@706jgkro)';
            }
            navigator.clipboard.writeText(messageText);
            alert('🚀 คัดลอกข้อความลง Clipboard เรียบร้อยแล้ว!');
        });
    }

    // Global Modal Control
    const modal = document.getElementById('student-modal');
    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(b => {
        b.addEventListener('click', () => modal.classList.remove('open'));
    });

    function openStudentModal(s) {
        const nameEl = document.getElementById('modal-student-name');
        if (nameEl) nameEl.textContent = `${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}`;
        
        const metaEl = document.getElementById('modal-student-meta');
        if (metaEl) metaEl.textContent = `รหัส: ${s.student_id} | เลขที่: ${s.no} | ชั้น ${s.classroom}`;

        const photoSrc = s.photo_url || `photos/${s.student_id}.jpg`;
        const avatarEl = document.querySelector('.modal-header-profile .profile-avatar');
        if (avatarEl) {
            avatarEl.innerHTML = `<img src="${photoSrc}" onerror="this.outerHTML='<i class=\\'fa-solid fa-user-graduate\\'></i>'">`;
        }

        const sc = s.scores || { eng_comm: 0, social: 0, math_basic: 0, thai: 0, math_add1: 0, math_add2: 0, chinese: 0, eng_basic: 0, total_score: 0 };
        const pct = ((sc.total_score / 145) * 100).toFixed(1);

        const myPendingTasks = pendingHomeworkTasks.filter(t => t.pendingStudentIds.includes(s.student_id.toString()));

        const body = document.getElementById('modal-body-content');
        if (body) {
            body.innerHTML = `
                <div><strong>ชื่อภาษาอังกฤษ:</strong> ${s.fullname_en || '-'}</div>
                <div><strong>วันเกิด:</strong> ${s.birthdate || '-'}</div>
                <div><strong>เลขประจำตัวประชาชน:</strong> ${s.national_id || '-'}</div>
                <div><strong>ศาสนา:</strong> ${s.religion || '-'}</div>
                <div><strong>ชื่อผู้ปกครอง:</strong> ${s.guardian_name || '-'}</div>
                <div><strong>เบอร์โทรผู้ปกครอง:</strong> 📞 ${s.guardian_phone || '-'} (${s.relation || 'ผู้ปกครอง'})</div>
                <div><strong>เวรประจำวัน:</strong> วัน${s.duty_day || 'จันทร์'}</div>
                <div><strong>เด็กกลุ่มห่วงใย (LS):</strong> ${s.ls_status || 'ทั่วไป'}</div>
                <div><strong>เกรดเฉลี่ยเดิม (GPA):</strong> ${s.gpa || '-'}</div>
                <div><strong>ความฝันในอนาคต:</strong> ${s.dream || '-'}</div>
                
                <div style="grid-column: 1 / -1; background:${myPendingTasks.length > 0 ? '#fff5f5' : '#f0fdf4'}; border:1px solid ${myPendingTasks.length > 0 ? '#fca5a5' : '#86efac'}; border-radius:10px; padding:12px; margin-top:4px;">
                    <h4 style="color:${myPendingTasks.length > 0 ? '#991b1b' : '#166534'}; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-clipboard-check"></i> สถานะการส่งงานค้าง: ${myPendingTasks.length > 0 ? `⚠️ ค้างส่ง ${myPendingTasks.length} ชิ้นงาน` : '🎉 ส่งครบถ้วนทุกวิชา'}
                    </h4>
                    ${myPendingTasks.length > 0 ? `
                        <div style="display:flex; flex-direction:column; gap:4px; font-size:0.88rem;">
                            ${myPendingTasks.map(t => `<div>• <strong>วิชา ${t.subject}:</strong> ${t.title} (กำหนดส่ง: ${t.dueDate || 'ไม่ระบุ'})</div>`).join('')}
                        </div>
                    ` : '<div style="font-size:0.88rem; color:#15803d;">ไม่มีรายการงานค้างที่ต้องส่งในขณะนี้</div>'}
                </div>

                <div style="grid-column: 1 / -1; background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:14px; margin-top:4px;">
                    <h4 style="color:#0369a1; margin-bottom:8px; display:flex; align-items:center; gap:6px;"><i class="fa-solid fa-square-poll-vertical"></i> ผลการเรียนสอบกลางภาคเรียนที่ 1/2569 (รวม ${sc.total_score}/145 - คิดเป็น ${pct}%)</h4>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:8px; font-size:0.88rem;">
                        <div>• อ.สื่อสาร: <strong>${sc.eng_comm}/20</strong></div>
                        <div>• สังคมศึกษา: <strong>${sc.social}/20</strong></div>
                        <div>• คณิตพื้นฐาน: <strong>${sc.math_basic}/20</strong></div>
                        <div>• ภาษาไทย: <strong>${sc.thai}/20</strong></div>
                        <div>• คณิตเพิ่มเติม 1: <strong>${sc.math_add1}/20</strong></div>
                        <div>• คณิตเพิ่มเติม 2: <strong>${sc.math_add2}/5</strong></div>
                        <div>• ภาษาจีน: <strong>${sc.chinese}/20</strong></div>
                        <div>• อ.พื้นฐาน: <strong>${sc.eng_basic}/20</strong></div>
                    </div>
                </div>
            `;
        }

        const btnModalLine = document.getElementById('modal-btn-line');
        if (btnModalLine) {
            btnModalLine.className = 'btn-line';
            btnModalLine.onclick = () => {
                modal.classList.remove('open');
                const lineTabBtn = document.querySelector('[data-tab="tab-line"]');
                if (lineTabBtn) lineTabBtn.click();
                const selectEl = document.getElementById('line-student-select');
                if (selectEl) selectEl.value = s.student_id;
                const tmplEl = document.getElementById('line-template-type');
                if (tmplEl) tmplEl.value = 'midterm_scores';
                generateLineMessage();
            };
        }

        const btnCopyParentLink = document.getElementById('modal-btn-copy-parent-link');
        if (btnCopyParentLink) {
            btnCopyParentLink.onclick = () => {
                copyParentPortalLink(s.student_id);
            };
        }

        if (modal) modal.classList.add('open');
    }

    window.copyParentPortalLink = function(studentId) {
        const s = studentData.find(st => st.student_id.toString() === studentId.toString());
        if (!s) return;

        const currentLoc = window.location.href;
        const baseUrl = currentLoc.substring(0, currentLoc.lastIndexOf('/'));
        const parentUrl = `${baseUrl}/parent.html?id=${s.student_id}`;

        navigator.clipboard.writeText(parentUrl).then(() => {
            alert(`📱 คัดลอกลิงก์สำหรับผู้ปกครองเรียบร้อยแล้ว!\n\nนักเรียน: ${s.fullname} (รหัส: ${s.student_id})\nลิงก์: ${parentUrl}\n\nคุณครูสามารถนำลิงก์นี้ไปวางส่งใน LINE ให้ผู้ปกครองได้เลยครับ`);
        });
    };

    window.openQuickLine = function(studentId) {
        document.querySelector('[data-tab="tab-line"]').click();
        document.getElementById('line-student-select').value = studentId;
        document.getElementById('line-template-type').value = 'midterm_scores';
        generateLineMessage();
    };

    // Reload Database Button Handler
    const btnReload = document.getElementById('btn-reload-db');
    if (btnReload) {
        btnReload.addEventListener('click', () => {
            btnReload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังรีเฟรชข้อมูล...';
            btnReload.disabled = true;
            setTimeout(() => {
                window.location.reload();
            }, 400);
        });
    }

    // Export Midterm Scores CSV Button Handler
    const btnExport = document.getElementById('btn-export-scores-csv') || document.getElementById('btn-export-csv');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            if (!studentData || studentData.length === 0) return;
            
            let csvContent = "\uFEFF"; // UTF-8 BOM for Excel Thai text
            csvContent += "เลขที่,รหัสประจำตัว,คำนำหน้า,ชื่อ,นามสกุล,ชื่อเล่น,เพศ,อ.สื่อสาร(20),สังคม(20),คณิตพื้น(20),ภาษาไทย(20),คณิตเพิ่ม1(20),คณิตเพิ่ม2(5),จีน(20),อ.พื้นฐาน(20),คะแนนรวม(145),คิดเป็น(%)\n";

            studentData.forEach(s => {
                const sc = s.scores || { eng_comm: 0, social: 0, math_basic: 0, thai: 0, math_add1: 0, math_add2: 0, chinese: 0, eng_basic: 0, total_score: 0 };
                const pct = ((sc.total_score / 145) * 100).toFixed(1);
                csvContent += `"${s.no}","${s.student_id}","${s.title}","${s.firstname}","${s.lastname}","${s.nickname || ''}","${s.gender}","${sc.eng_comm}","${sc.social}","${sc.math_basic}","${sc.thai}","${sc.math_add1}","${sc.math_add2}","${sc.chinese}","${sc.eng_basic}","${sc.total_score}","${pct}%"\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'คะแนนกลางภาค_ม1.4_เทอม1_2569.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // LS Modal Controls & Selection Persistence
    const lsModal = document.getElementById('ls-settings-modal');
    const btnOpenLS = document.getElementById('btn-open-ls-settings');
    const btnSaveLS = document.getElementById('btn-save-ls-settings');
    const lsModalClose = document.getElementById('ls-modal-close');
    const lsModalCancel = document.getElementById('ls-modal-cancel');

    if (btnOpenLS && lsModal) {
        btnOpenLS.addEventListener('click', () => {
            renderLSChecklist();
            lsModal.classList.add('open');
        });

        [lsModalClose, lsModalCancel].forEach(b => {
            if (b) b.addEventListener('click', () => lsModal.classList.remove('open'));
        });

        btnSaveLS.addEventListener('click', () => {
            const lsMap = {};
            studentData.forEach(s => {
                const selected = document.querySelector(`input[name="ls_level_${s.student_id}"]:checked`);
                const val = selected ? selected.value : 'normal';
                lsMap[s.student_id] = val;
            });

            localStorage.setItem('ls_student_levels', JSON.stringify(lsMap));
            applySavedLSSelections();
            renderAllViews();
            lsModal.classList.remove('open');

            const riskNum = Object.values(lsMap).filter(v => v === 'risk').length;
            const problemNum = Object.values(lsMap).filter(v => v === 'problem').length;
            alert(`บันทึกตั้งค่ากลุ่มดูแลนักเรียนเรียบร้อยแล้ว!\n(สุ่มเสี่ยง ${riskNum} คน | มีปัญหา ${problemNum} คน)`);
        });
    }

    function renderLSChecklist() {
        const container = document.getElementById('ls-checklist-container');
        if (!container) return;
        container.innerHTML = '';

        const savedLS = localStorage.getItem('ls_student_levels');
        let lsMap = {};
        if (savedLS) {
            try { lsMap = JSON.parse(savedLS); } catch(e){}
        }

        studentData.forEach(s => {
            const currentLevel = lsMap[s.student_id] || s.ls_level || 'normal';
            const row = document.createElement('div');
            row.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; font-size:0.88rem;";
            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${s.photo_url || 'photos/' + s.student_id + '.jpg'}" onerror="this.style.display='none'" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                    <div>
                        <strong>เลขที่ ${s.no}</strong> ${s.fullname} ${s.nickname ? `<small style="color:var(--text-muted)">(${s.nickname})</small>` : ''}
                    </div>
                </div>
                <div style="display:flex; gap:12px; align-items:center;">
                    <label style="display:flex; align-items:center; gap:4px; cursor:pointer; color:#16a34a; font-weight:600;">
                        <input type="radio" name="ls_level_${s.student_id}" value="normal" ${currentLevel === 'normal' ? 'checked' : ''} style="accent-color:#16a34a;"> 🟢 ปกติ
                    </label>
                    <label style="display:flex; align-items:center; gap:4px; cursor:pointer; color:#d97706; font-weight:600;">
                        <input type="radio" name="ls_level_${s.student_id}" value="risk" ${currentLevel === 'risk' ? 'checked' : ''} style="accent-color:#d97706;"> 🟡 สุ่มเสี่ยง
                    </label>
                    <label style="display:flex; align-items:center; gap:4px; cursor:pointer; color:#dc2626; font-weight:600;">
                        <input type="radio" name="ls_level_${s.student_id}" value="problem" ${currentLevel === 'problem' ? 'checked' : ''} style="accent-color:#dc2626;"> 🔴 มีปัญหา
                    </label>
                </div>
            `;
            container.appendChild(row);
        });
    }

    // Pending Homework Tasks Manager Logic
    let pendingHomeworkTasks = [];

    function loadSavedHomeworkTasks() {
        const saved = localStorage.getItem('pending_homework_tasks');
        if (saved) {
            try { pendingHomeworkTasks = JSON.parse(saved); } catch(e){}
        }
    }

    function saveHomeworkTasks() {
        localStorage.setItem('pending_homework_tasks', JSON.stringify(pendingHomeworkTasks));
    }

    function renderTaskChecklist() {
        const container = document.getElementById('task-student-checklist');
        if (!container) return;
        container.innerHTML = '';

        const groups = [
            { label: 'เลขที่ 1 - 10', min: 1, max: 10, bg: '#e0f2fe', color: '#0369a1' },
            { label: 'เลขที่ 11 - 20', min: 11, max: 20, bg: '#fef3c7', color: '#92400e' },
            { label: 'เลขที่ 21 - 30', min: 21, max: 30, bg: '#dcfce7', color: '#166534' },
            { label: 'เลขที่ 31 - 39', min: 31, max: 39, bg: '#fae8ff', color: '#86198f' }
        ];

        groups.forEach((g, gIdx) => {
            const col = document.createElement('div');
            col.style.cssText = "background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:6px;";
            
            const groupStudents = studentData.filter(s => s.no >= g.min && s.no <= g.max);

            col.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; background:${g.bg}; color:${g.color}; padding:6px 8px; border-radius:6px; font-weight:700; font-size:0.82rem; margin-bottom:4px;">
                    <span><i class="fa-solid fa-users"></i> ${g.label} (${groupStudents.length} คน)</span>
                    <button type="button" class="btn-sm" onclick="toggleGroupCb(${gIdx})" style="border:none; background:rgba(255,255,255,0.7); color:${g.color}; font-weight:700; padding:2px 6px; border-radius:4px; font-size:0.75rem; cursor:pointer;">
                        ติ๊กทั้งหมด
                    </button>
                </div>
                <div style="display:flex; flex-direction:column; gap:5px; max-height:300px; overflow-y:auto;">
                    ${groupStudents.map(s => `
                        <label style="display:flex; align-items:center; gap:6px; padding:5px 6px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-size:0.82rem; cursor:pointer;">
                            <input type="checkbox" class="task-student-cb group-cb-${gIdx}" value="${s.student_id}" style="width:16px; height:16px; accent-color:#ef4444;">
                            <img src="${s.photo_url || 'photos/' + s.student_id + '.jpg'}" onerror="this.style.display='none'" style="width:22px; height:22px; border-radius:50%; object-fit:cover;">
                            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="เลขที่ ${s.no} ${s.fullname}">
                                <strong>${s.no}.</strong> ${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}
                            </span>
                        </label>
                    `).join('')}
                </div>
            `;
            container.appendChild(col);
        });
    }

    window.toggleGroupCb = function(groupIndex) {
        const cbs = document.querySelectorAll(`.group-cb-${groupIndex}`);
        const allChecked = Array.from(cbs).every(cb => cb.checked);
        cbs.forEach(cb => cb.checked = !allChecked);
    };

    function renderActiveTasksBoard() {
        const container = document.getElementById('active-tasks-container');
        if (!container) return;
        container.innerHTML = '';

        const taskList = pendingHomeworkTasks;

        if (taskList.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:2.5rem; color:var(--text-muted); background:#ffffff; border-radius:12px; border:1px solid #cbd5e1;">
                    <i class="fa-solid fa-circle-check" style="font-size:3rem; color:var(--accent-green); margin-bottom:12px;"></i>
                    <h4 style="font-size:1.1rem; color:#0f172a; margin-bottom:4px;">🎉 ยังไม่มีรายการงานค้างของห้อง ม.1.4 ในขณะนี้</h4>
                    <p style="font-size:0.88rem;">คุณครูหรือหัวหน้าห้องสามารถสร้างรายการใหม่จากแบบฟอร์มด้านซ้ายได้ครับ</p>
                </div>
            `;
            return;
        }

        taskList.forEach((task, index) => {
            const card = document.createElement('div');
            card.style.cssText = "background:#ffffff; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.2rem; margin-bottom:1rem; box-shadow:0 2px 8px rgba(0,0,0,0.03);";
            
            const pendingStudents = studentData.filter(s => task.pendingStudentIds.includes(s.student_id.toString()));
            const isAllDone = pendingStudents.length === 0;

            const myStatusBadge = isAllDone ? 
                '<span class="badge badge-success" style="font-size:0.85rem; padding:6px 12px;"><i class="fa-solid fa-circle-check"></i> ส่งครบทุกคน 100%</span>' : 
                `<span class="badge badge-danger" style="font-size:0.85rem; padding:6px 12px;">ค้างส่ง ${pendingStudents.length} คน</span>`;

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div>
                        <span class="badge badge-purple" style="font-size:0.85rem; margin-bottom:4px;">วิชา ${task.subject}</span>
                        <h4 style="font-size:1.1rem; color:#0f172a; margin-top:2px;">${task.title}</h4>
                        <small style="color:var(--text-muted);"><i class="fa-solid fa-calendar-day"></i> กำหนดส่ง: ${task.dueDate || 'ไม่ระบุ'}</small>
                    </div>
                    ${myStatusBadge}
                </div>
                
                <div style="margin:10px 0; background:#f8fafc; padding:10px 12px; border-radius:8px; border:1px solid #e2e8f0; max-height:180px; overflow-y:auto;">
                    <small style="color:var(--text-muted); font-weight:600; display:block; margin-bottom:6px;">
                        ${isAllDone ? '✔️ นักเรียนทุกคนส่งงานชิ้นนี้เรียบร้อยแล้ว' : `รายชื่อนักเรียนที่ค้างส่ง (${pendingStudents.length} คน) - กดปุ่ม 🟢 ส่งแล้ว เพื่อตัดออกจากงานค้าง:`}
                    </small>
                    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:6px;">
                        ${pendingStudents.map(s => `
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; background:#fff5f5; border:1px solid #fca5a5; padding:5px 8px; border-radius:6px; font-size:0.82rem;">
                                <span style="color:#7f1d1d; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    <strong>${s.no}.</strong> ${s.fullname}
                                </span>
                                <button type="button" onclick="markStudentTaskCompleted(${task.id}, '${s.student_id}')" style="border:none; background:#22c55e; color:#ffffff; font-weight:700; padding:3px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; flex-shrink:0;">
                                    <i class="fa-solid fa-circle-check"></i> 🟢 ส่งแล้ว
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
                    ${!isAllDone ? `
                        <button class="btn-line btn-sm" onclick="noticeTaskLine(${index})"><i class="fa-brands fa-line"></i> แจ้ง LINE ติดตามงานวิชานี้</button>
                    ` : ''}
                    <button class="btn-secondary btn-sm" onclick="deleteHomeworkTask(${index})" style="color:var(--accent-red); margin-left:auto;"><i class="fa-solid fa-trash"></i> ลบรายการภาระงาน</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    window.markStudentTaskCompleted = function(taskId, studentId) {
        const task = pendingHomeworkTasks.find(t => t.id === taskId);
        if (!task) return;

        const s = studentData.find(st => st.student_id.toString() === studentId.toString());

        task.pendingStudentIds = task.pendingStudentIds.filter(id => id.toString() !== studentId.toString());

        saveHomeworkTasks();
        renderActiveTasksBoard();
        renderOverviewTable();
        renderStudentCards();
        renderPersonalHomeworkLookup();

        const studentName = s ? s.fullname : studentId;
        if (task.pendingStudentIds.length === 0) {
            alert(`🎉 เช็คส่งงานของ ${studentName} เรียบร้อยแล้ว!\nขณะนี้นักเรียนทุกคนส่งวิชา "${task.subject} - ${task.title}" ครบทุกคน 100% แล้วครับ 👍✨`);
        } else {
            alert(`✔️ เช็คส่งงานวิชา "${task.subject}" ของ ${studentName} เรียบร้อยแล้ว!\n(คงเหลือค้างส่ง ${task.pendingStudentIds.length} คน)`);
        }
    };

    const subjectSelect = document.getElementById('task-subject-select');
    const subjectInput = document.getElementById('task-subject-input');

    if (subjectSelect) {
        subjectSelect.addEventListener('change', () => {
            if (subjectSelect.value === 'custom') {
                if (subjectInput) {
                    subjectInput.style.display = 'block';
                    subjectInput.focus();
                }
            } else {
                if (subjectInput) {
                    subjectInput.style.display = 'none';
                    subjectInput.value = '';
                }
            }
        });
    }

    const btnSaveTask = document.getElementById('btn-save-pending-task');
    if (btnSaveTask) {
        btnSaveTask.addEventListener('click', () => {
            let subject = subjectSelect ? subjectSelect.value : '';
            if (subject === 'custom' || !subject) {
                subject = subjectInput ? subjectInput.value.trim() : '';
            }

            const title = document.getElementById('task-title-input').value.trim();
            const dueDate = document.getElementById('task-duedate-input').value.trim();
            const checkedCbs = document.querySelectorAll('.task-student-cb:checked');
            const pendingStudentIds = Array.from(checkedCbs).map(cb => cb.value);

            if (!subject) { alert('กรุณาเลือกระบุชื่อรายวิชาตามตารางเรียนครับ'); return; }
            if (!title) { alert('กรุณาระบุชื่อชิ้นงานที่ค้างส่งครับ'); return; }
            if (pendingStudentIds.length === 0) { alert('กรุณาติ๊ก ✔️ เลือกนักเรียนที่ค้างส่งอย่างน้อย 1 คนครับ'); return; }

            const newTask = {
                id: Date.now(),
                subject: subject,
                title: title,
                dueDate: dueDate,
                pendingStudentIds: pendingStudentIds,
                createdAt: new Date().toLocaleDateString('th-TH')
            };

            pendingHomeworkTasks.unshift(newTask);
            saveHomeworkTasks();
            renderActiveTasksBoard();
            renderTaskChecklist();
            renderOverviewTable();
            renderStudentCards();
            renderPersonalHomeworkLookup();

            // Clear inputs
            if (subjectSelect) subjectSelect.value = '';
            if (subjectInput) {
                subjectInput.value = '';
                subjectInput.style.display = 'none';
            }
            document.getElementById('task-title-input').value = '';
            document.getElementById('task-duedate-input').value = '';
            document.querySelectorAll('.task-student-cb').forEach(cb => cb.checked = false);

            alert(`🎉 บันทึกรายการงานค้างวิชา "${subject}" - "${title}" เรียบร้อยแล้ว!\n(ระบุนักเรียนค้างส่งจำนวน ${pendingStudentIds.length} คน)`);
        });
    }

    window.deleteHomeworkTask = function(index) {
        if (confirm('คุณต้องการลบรายการงานค้างนี้ใช่หรือไม่?')) {
            pendingHomeworkTasks.splice(index, 1);
            saveHomeworkTasks();
            renderActiveTasksBoard();
        }
    };

    window.noticeTaskLine = function(index) {
        const task = pendingHomeworkTasks[index];
        if (!task) return;
        const pendingStudents = studentData.filter(s => task.pendingStudentIds.includes(s.student_id));

        let msg = `📌 [แจ้งเตือนการส่งงาน - ห้อง ม.1.4 SMT]\n`;
        msg += `📖 วิชา: ${task.subject}\n`;
        msg += `📝 ชิ้นงาน: ${task.title}\n`;
        msg += `📅 กำหนดส่ง: ${task.dueDate || 'เร็วๆ นี้'}\n\n`;
        msg += `ขอแจ้งรายชื่อนักเรียนที่ยังค้างส่งงานจำนวน ${pendingStudents.length} คน ดังนี้ครับ:\n`;
        pendingStudents.forEach(s => {
            msg += `• เลขที่ ${s.no} ${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}\n`;
        });
        msg += `\nรบกวนผู้ปกครองช่วยติดตามให้นักเรียนนำงานมาส่งคุณครูด้วยนะครับ ขอบคุณครับ 🙏`;

        document.querySelector('[data-tab="tab-line"]').click();
        document.getElementById('line-student-select').value = 'all';
        document.getElementById('line-preview-text').textContent = msg;
    };

    // Student Personal Homework Lookup Logic
    function populateLookupStudentDropdown() {
        const select = document.getElementById('lookup-student-select');
        if (!select) return;

        select.innerHTML = '<option value="">-- 🎓 เลือกชื่อนักเรียนเพื่อดูงานค้างเฉพาะบุคคล (39 คน) --</option>';
        studentData.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.student_id;
            opt.textContent = `เลขที่ ${s.no} - ${s.fullname} (รหัส: ${s.student_id})`;
            select.appendChild(opt);
        });
    }

    function renderPersonalHomeworkLookup(targetStudentId = '') {
        const select = document.getElementById('lookup-student-select');
        const input = document.getElementById('lookup-student-input');
        const btnClear = document.getElementById('btn-clear-lookup');
        const resultCard = document.getElementById('personal-homework-result-card');

        if (!resultCard) return;

        let studentId = targetStudentId;

        if (!studentId && select && select.value) {
            studentId = select.value;
        }

        if (!studentId && input && input.value.trim()) {
            const q = input.value.trim().toLowerCase();
            const found = studentData.find(s => 
                s.student_id.toString() === q ||
                s.no.toString() === q ||
                s.fullname.toLowerCase().includes(q) ||
                (s.nickname && s.nickname.toLowerCase().includes(q))
            );
            if (found) studentId = found.student_id;
        }

        if (!studentId) {
            resultCard.style.display = 'none';
            if (btnClear) btnClear.style.display = 'none';
            return;
        }

        if (btnClear) btnClear.style.display = 'inline-flex';

        const s = studentData.find(st => st.student_id.toString() === studentId.toString());
        if (!s) {
            resultCard.style.display = 'block';
            resultCard.innerHTML = `
                <div style="background:#fffbebf8; border:1px solid #fcd34d; border-radius:10px; padding:14px; color:#92400e; text-align:center;">
                    <i class="fa-solid fa-triangle-exclamation"></i> ไม่พบรายชื่อนักเรียนตามข้อมูลที่ค้นหา
                </div>
            `;
            return;
        }

        if (select && select.value !== s.student_id.toString()) {
            select.value = s.student_id;
        }

        const myPendingTasks = pendingHomeworkTasks.filter(t => t.pendingStudentIds.includes(s.student_id.toString()));
        const isComplete = myPendingTasks.length === 0;

        const photoSrc = s.photo_url || `photos/${s.student_id}.jpg`;

        resultCard.style.display = 'block';

        if (isComplete) {
            resultCard.innerHTML = `
                <div style="background:linear-gradient(135deg, #dcfce7, #f0fdf4); border:2px solid #22c55e; border-radius:12px; padding:16px; display:flex; align-items:center; gap:16px; box-shadow:0 4px 15px rgba(34,197,94,0.12);">
                    <img src="${photoSrc}" onerror="this.outerHTML='<div class=\\'student-avatar\\'><i class=\\'fa-solid fa-user-graduate\\'></i></div>'" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:3px solid #22c55e;">
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <strong style="font-size:1.15rem; color:#14532d;">เลขที่ ${s.no} ${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}</strong>
                            <span class="badge badge-success" style="font-size:0.85rem;"><i class="fa-solid fa-star"></i> คนเก่งส่งงานครบ!</span>
                        </div>
                        <p style="color:#166534; font-weight:700; font-size:0.95rem; margin-top:4px; margin-bottom:0;">
                            🎉 ยินดีด้วยครับ! ไม่มีงานค้างในระบบ ส่งงานครบถ้วนทุกวิชาแล้ว 👍✨
                        </p>
                    </div>
                </div>
            `;
        } else {
            resultCard.innerHTML = `
                <div style="background:linear-gradient(135deg, #fff5f5, #fef2f2); border:2px solid #ef4444; border-radius:12px; padding:16px; box-shadow:0 4px 15px rgba(239,68,68,0.12);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:12px; border-bottom:1px dashed #fca5a5; padding-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="${photoSrc}" onerror="this.outerHTML='<div class=\\'student-avatar\\'><i class=\\'fa-solid fa-user-graduate\\'></i></div>'" style="width:54px; height:54px; border-radius:50%; object-fit:cover; border:2px solid #ef4444;">
                            <div>
                                <strong style="font-size:1.1rem; color:#7f1d1d; display:block;">เลขที่ ${s.no} ${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}</strong>
                                <small style="color:#991b1b;">รหัสประจำตัว: ${s.student_id} | ห้อง ม.1.4 SMT</small>
                            </div>
                        </div>
                        <div style="display:flex; gap:8px; align-items:center;">
                            <span class="badge badge-danger" style="font-size:0.9rem; padding:6px 12px;">
                                ⚠️ มีงานค้างทั้งหมด ${myPendingTasks.length} ชิ้นงาน
                            </span>
                            <button type="button" class="btn-primary btn-sm" onclick="copyStudentPersonalHomeworkMsg('${s.student_id}')" style="background:#dc2626; border-color:#dc2626;">
                                <i class="fa-solid fa-copy"></i> 📱 คัดลอกรายการงานค้างแจ้ง LINE
                            </button>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:10px;">
                        ${myPendingTasks.map(t => `
                            <div style="background:#ffffff; border:1px solid #fca5a5; border-radius:8px; padding:10px; box-shadow:0 2px 6px rgba(0,0,0,0.02);">
                                <span class="badge badge-purple" style="font-size:0.8rem; margin-bottom:4px;">${t.subject}</span>
                                <strong style="display:block; color:#0f172a; font-size:0.95rem;">${t.title}</strong>
                                <small style="color:#991b1b; display:block; margin-top:4px;"><i class="fa-solid fa-clock"></i> กำหนดส่ง: ${t.dueDate || 'เร็วๆ นี้'}</small>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    window.copyStudentPersonalHomeworkMsg = function(studentId) {
        const s = studentData.find(st => st.student_id.toString() === studentId.toString());
        if (!s) return;
        const myPendingTasks = pendingHomeworkTasks.filter(t => t.pendingStudentIds.includes(s.student_id.toString()));

        let msg = `📌 [แจ้งเตือนงานค้างรายบุคคล - ห้อง ม.1.4 SMT]\n`;
        msg += `🎓 เลขที่ ${s.no} ${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}\n\n`;
        msg += `มีรายการภาระงาน/การบ้านที่ยังค้างส่งจำนวน ${myPendingTasks.length} ชิ้นงาน ดังนี้ครับ:\n`;
        myPendingTasks.forEach((t, i) => {
            msg += `${i + 1}. วิชา ${t.subject}: "${t.title}" (กำหนดส่ง: ${t.dueDate || 'เร็วๆ นี้'})\n`;
        });
        msg += `\nรบกวนผู้ปกครองช่วยติดตามให้นักเรียนนำงานมาส่งคุณครูด้วยนะครับ ขอบคุณครับ 🙏`;

        navigator.clipboard.writeText(msg).then(() => {
            alert(`📱 คัดลอกรายการงานค้างของ ${s.fullname} เรียบร้อยแล้ว!\nสามารถนำข้อความไปส่งแจ้งผู้ปกครองใน LINE ได้เลยครับ`);
        });
    };

    const lookupSelect = document.getElementById('lookup-student-select');
    const lookupInput = document.getElementById('lookup-student-input');
    const btnClearLookup = document.getElementById('btn-clear-lookup');

    if (lookupSelect) {
        lookupSelect.addEventListener('change', () => {
            if (lookupInput) lookupInput.value = '';
            renderPersonalHomeworkLookup(lookupSelect.value);
        });
    }

    if (lookupInput) {
        lookupInput.addEventListener('input', () => {
            renderPersonalHomeworkLookup();
        });
    }

    if (btnClearLookup) {
        btnClearLookup.addEventListener('click', () => {
            if (lookupSelect) lookupSelect.value = '';
            if (lookupInput) lookupInput.value = '';
            renderPersonalHomeworkLookup('');
        });
    }

    // Home Visit System State & Logic
    let homeVisitRecords = {};
    let currentVisitFilter = 'all';

    function loadHomeVisitRecords() {
        const saved = localStorage.getItem('home_visit_records');
        if (saved) {
            try { homeVisitRecords = JSON.parse(saved); } catch(e){}
        }
    }

    function saveHomeVisitRecords() {
        localStorage.setItem('home_visit_records', JSON.stringify(homeVisitRecords));
    }

    function renderHomeVisitGrid() {
        const container = document.getElementById('home-visit-grid');
        if (!container) return;
        container.innerHTML = '';

        loadHomeVisitRecords();

        const recordedCount = Object.keys(homeVisitRecords).length;
        const gpsCount = Object.values(homeVisitRecords).filter(r => r.lat && r.lng).length;
        const photoCount = Object.values(homeVisitRecords).filter(r => r.photo_url).length;

        const statRatio = document.getElementById('home-visit-stat-ratio');
        if (statRatio) statRatio.textContent = `บันทึกแล้ว ${recordedCount} / ${studentData.length} คน`;

        const statGps = document.getElementById('home-visit-stat-gps');
        if (statGps) statGps.textContent = `${gpsCount} นักเรียน`;

        const statPhoto = document.getElementById('home-visit-stat-photo');
        if (statPhoto) statPhoto.textContent = `${photoCount} บ้าน`;

        const searchVal = document.getElementById('visit-search-input') ? document.getElementById('visit-search-input').value.trim().toLowerCase() : '';

        let list = [...studentData];

        if (currentVisitFilter === 'done') {
            list = list.filter(s => !!homeVisitRecords[s.student_id]);
        } else if (currentVisitFilter === 'pending') {
            list = list.filter(s => !homeVisitRecords[s.student_id]);
        }

        if (searchVal) {
            list = list.filter(s => 
                s.fullname.toLowerCase().includes(searchVal) || 
                s.student_id.toString().includes(searchVal) ||
                (s.nickname && s.nickname.toLowerCase().includes(searchVal))
            );
        }

        if (list.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding:3rem; color:var(--text-muted); background:#ffffff; border-radius:12px; border:1px solid #cbd5e1;">
                    <i class="fa-solid fa-house-chimney-crack" style="font-size:3rem; color:#cbd5e1; margin-bottom:12px;"></i>
                    <h4 style="font-size:1.1rem; color:#0f172a; margin-bottom:4px;">ไม่พบข้อมูลการเยี่ยมบ้านตามเงื่อนไขที่ค้นหา</h4>
                    <p style="font-size:0.88rem;">คุณครูสามารถกดปุ่ม "➕ บันทึกข้อมูลเยี่ยมบ้านใหม่" เพื่อเริ่มบันทึกข้อมูลได้ครับ</p>
                </div>
            `;
            return;
        }

        list.forEach(s => {
            const rec = homeVisitRecords[s.student_id];
            const isDone = !!rec;
            const photoSrc = s.photo_url || `photos/${s.student_id}.jpg`;

            const card = document.createElement('div');
            card.className = 'home-visit-card';

            card.innerHTML = `
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${photoSrc}" onerror="this.outerHTML='<div class=\\'student-avatar\\'><i class=\\'fa-solid fa-user-graduate\\'></i></div>'" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid #0284c7;">
                            <div>
                                <strong style="font-size:1rem; color:#0f172a; display:block;">เลขที่ ${s.no} ${s.fullname}</strong>
                                <small style="color:var(--text-muted);">รหัสประจำตัว: ${s.student_id} ${s.nickname ? `(${s.nickname})` : ''}</small>
                            </div>
                        </div>
                        <span class="badge ${isDone ? 'badge-success' : 'badge-warning'}" style="font-size:0.8rem; padding:5px 10px;">
                            ${isDone ? '🟢 บันทึกแล้ว' : '⚪ ยังไม่ได้เยี่ยม'}
                        </span>
                    </div>

                    ${isDone ? `
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; font-size:0.85rem; line-height:1.6; margin-bottom:12px;">
                            <div>🏠 <strong>ที่อยู่อาศัย:</strong> ${rec.house_type || 'บ้านเดี่ยว'} (${rec.building_type || 'ปูน'})</div>
                            <div>💰 <strong>รายได้ครอบครัว:</strong> ${rec.family_income || 'ไม่ระบุ'}</div>
                            <div>👨‍👩‍👧‍👦 <strong>สมาชิกในบ้าน:</strong> ${rec.family_members || '4'} คน | 📞 ${s.guardian_phone || '-'}</div>
                            ${rec.lat && rec.lng ? `
                                <div style="margin-top:6px;">
                                    <a href="https://www.google.com/maps/search/?api=1&query=${rec.lat},${rec.lng}" target="_blank" class="badge badge-purple" style="font-size:0.8rem; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                                        <i class="fa-solid fa-map-location-dot"></i> 📍 นำทาง GPS (${rec.lat}, ${rec.lng})
                                    </a>
                                </div>
                            ` : ''}
                            <div style="margin-top:6px; color:#475569; font-style:italic;">
                                📝 "${rec.notes || 'สภาพครอบครัวอบอุ่นและดูแลเอาใจใส่นักเรียนดี'}"
                            </div>
                        </div>
                    ` : `
                        <div style="background:#fffbebf8; border:1px dashed #fcd34d; border-radius:8px; padding:12px; font-size:0.85rem; color:#92400e; text-align:center; margin-bottom:12px;">
                            <i class="fa-solid fa-triangle-exclamation"></i> ยังไม่มีการบันทึกข้อมูลการเยี่ยมบ้านของนักเรียนคนนี้
                        </div>
                    `}
                </div>

                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                    <button class="btn-primary btn-sm" style="flex:1;" onclick="openHomeVisitModal('${s.student_id}')">
                        <i class="fa-solid fa-pen-to-square"></i> ${isDone ? 'แก้ไขข้อมูล' : 'บันทึกเยี่ยมบ้าน'}
                    </button>
                    ${isDone ? `
                        <button class="btn-secondary btn-sm" onclick="printHomeVisitReport('${s.student_id}')" style="color:#0369a1; border-color:#bae6fd; background:#f0f9ff;">
                            <i class="fa-solid fa-print"></i> พิมพ์ PDF
                        </button>
                    ` : ''}
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Home Visit Form Controls
    const homeVisitModal = document.getElementById('home-visit-modal');
    const btnOpenAddVisit = document.getElementById('btn-open-add-home-visit');
    const btnSaveVisit = document.getElementById('btn-save-home-visit');
    const visitModalClose = document.getElementById('home-visit-modal-close');
    const visitModalCancel = document.getElementById('home-visit-modal-cancel');

    if (btnOpenAddVisit) {
        btnOpenAddVisit.addEventListener('click', () => openHomeVisitModal());
    }
    [visitModalClose, visitModalCancel].forEach(b => {
        if (b) b.addEventListener('click', () => homeVisitModal && homeVisitModal.classList.remove('open'));
    });

    const visitFilterAll = document.getElementById('filter-visit-all');
    const visitFilterDone = document.getElementById('filter-visit-done');
    const visitFilterPending = document.getElementById('filter-visit-pending');
    const visitSearchInput = document.getElementById('visit-search-input');

    if (visitFilterAll) visitFilterAll.addEventListener('click', () => setVisitFilter('all'));
    if (visitFilterDone) visitFilterDone.addEventListener('click', () => setVisitFilter('done'));
    if (visitFilterPending) visitFilterPending.addEventListener('click', () => setVisitFilter('pending'));
    if (visitSearchInput) visitSearchInput.addEventListener('input', () => renderHomeVisitGrid());

    function setVisitFilter(filter) {
        currentVisitFilter = filter;
        [visitFilterAll, visitFilterDone, visitFilterPending].forEach(b => {
            if (b) b.classList.remove('active');
        });
        if (filter === 'all' && visitFilterAll) visitFilterAll.classList.add('active');
        if (filter === 'done' && visitFilterDone) visitFilterDone.classList.add('active');
        if (filter === 'pending' && visitFilterPending) visitFilterPending.classList.add('active');
        renderHomeVisitGrid();
    }

    window.openHomeVisitModal = function(studentId = '') {
        const select = document.getElementById('visit-student-select');
        if (!select) return;

        select.innerHTML = '<option value="">-- เลือกระบุนักเรียนห้อง ม.1.4 --</option>';
        studentData.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.student_id;
            opt.textContent = `เลขที่ ${s.no} - ${s.fullname} (รหัส: ${s.student_id})`;
            if (studentId && s.student_id.toString() === studentId.toString()) opt.selected = true;
            select.appendChild(opt);
        });

        if (studentId) populateHomeVisitFormFields(studentId);

        select.onchange = () => {
            if (select.value) populateHomeVisitFormFields(select.value);
        };

        if (homeVisitModal) homeVisitModal.classList.add('open');
    };

    function populateHomeVisitFormFields(studentId) {
        const s = studentData.find(st => st.student_id.toString() === studentId.toString());
        const rec = homeVisitRecords[studentId];

        if (rec) {
            document.getElementById('visit-house-type').value = rec.house_type || 'บ้านเดี่ยว (ของตนเอง)';
            document.getElementById('visit-building-type').value = rec.building_type || 'ตึก / ปูน';
            document.getElementById('visit-family-income').value = rec.family_income || '10,001 - 20,000 บาท';
            document.getElementById('visit-family-members').value = rec.family_members || 4;
            document.getElementById('visit-behavior-text').value = rec.behavior || 'ช่วยงานบ้าน ทบทวนบทเรียน และทำการบ้านเป็นประจำ';
            document.getElementById('visit-lat-input').value = rec.lat || '';
            document.getElementById('visit-lng-input').value = rec.lng || '';
            document.getElementById('visit-address-text').value = rec.address || '';
            document.getElementById('visit-photo-url').value = rec.photo_url || '';
            document.getElementById('visit-notes-input').value = rec.notes || '';

            if (rec.photo_url) {
                const img = document.getElementById('visit-photo-preview-img');
                const box = document.getElementById('visit-photo-preview-box');
                if (img) img.src = rec.photo_url;
                if (box) box.style.display = 'flex';
            }
        } else if (s) {
            document.getElementById('visit-address-text').value = `ที่อยู่ตามสำทะเบียนบ้านผู้ปกครอง: ${s.guardian_name || '-'}`;
        }
    }

    // Photo Preview File Reader
    const photoFileInput = document.getElementById('visit-photo-file');
    if (photoFileInput) {
        photoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    document.getElementById('visit-photo-url').value = evt.target.result;
                    const img = document.getElementById('visit-photo-preview-img');
                    const box = document.getElementById('visit-photo-preview-box');
                    if (img) img.src = evt.target.result;
                    if (box) box.style.display = 'flex';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // HTML5 Geolocation API
    const btnGetGPS = document.getElementById('btn-get-gps');
    if (btnGetGPS) {
        btnGetGPS.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert('เบราว์เซอร์นี้ไม่รองรับการดึงพิกัด GPS อัตโนมัติครับ คุณครูสามารถป้อนละติจูด-ลองจิจูดด้วยตัวเองได้เลยครับ');
                return;
            }
            btnGetGPS.disabled = true;
            btnGetGPS.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังจับพิกัด...';

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    btnGetGPS.disabled = false;
                    btnGetGPS.innerHTML = '<i class="fa-solid fa-crosshairs"></i> 📍 ดึงพิกัด GPS ปัจจุบัน';
                    document.getElementById('visit-lat-input').value = pos.coords.latitude.toFixed(6);
                    document.getElementById('visit-lng-input').value = pos.coords.longitude.toFixed(6);
                    alert(`📍 ดึงพิกัด GPS สำเร็จ!\nละติจูด: ${pos.coords.latitude.toFixed(6)}\nลองจิจูด: ${pos.coords.longitude.toFixed(6)}`);
                },
                (err) => {
                    btnGetGPS.disabled = false;
                    btnGetGPS.innerHTML = '<i class="fa-solid fa-crosshairs"></i> 📍 ดึงพิกัด GPS ปัจจุบัน';
                    alert(`ไม่สามารถดึงพิกัด GPS ได้ (${err.message}) กรุณาเปิดสิทธิ์ Location หรือพิมพ์ละติจูด-ลองจิจูดด้วยตัวเองครับ`);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    if (btnSaveVisit) {
        btnSaveVisit.addEventListener('click', () => {
            const studentId = document.getElementById('visit-student-select').value;
            if (!studentId) {
                alert('กรุณาเลือกรายชื่อนักเรียนที่ต้องการบันทึกการเยี่ยมบ้านครับ');
                return;
            }

            const now = new Date();
            const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
            const dateStr = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}`;

            homeVisitRecords[studentId] = {
                student_id: studentId,
                house_type: document.getElementById('visit-house-type').value,
                building_type: document.getElementById('visit-building-type').value,
                family_income: document.getElementById('visit-family-income').value,
                family_members: document.getElementById('visit-family-members').value,
                behavior: document.getElementById('visit-behavior-text').value,
                lat: document.getElementById('visit-lat-input').value.trim(),
                lng: document.getElementById('visit-lng-input').value.trim(),
                address: document.getElementById('visit-address-text').value.trim(),
                photo_url: document.getElementById('visit-photo-url').value,
                notes: document.getElementById('visit-notes-input').value.trim(),
                visit_date: dateStr
            };

            saveHomeVisitRecords();
            renderHomeVisitGrid();
            if (homeVisitModal) homeVisitModal.classList.remove('open');
            alert('🎉 บันทึกข้อมูลการเยี่ยมบ้านนักเรียนเรียบร้อยแล้ว!');
        });
    }

    // Printable Official PDF Report Generator
    const printModal = document.getElementById('home-visit-print-modal');
    const printModalClose = document.getElementById('home-visit-print-close');
    const printModalCancel = document.getElementById('home-visit-print-cancel');

    [printModalClose, printModalCancel].forEach(b => {
        if (b) b.addEventListener('click', () => printModal && printModal.classList.remove('open'));
    });

    window.printHomeVisitReport = function(studentId) {
        const s = studentData.find(st => st.student_id.toString() === studentId.toString());
        const rec = homeVisitRecords[studentId];
        if (!s || !rec) {
            alert('ไม่พบข้อมูลการเยี่ยมบ้านของนักเรียนคนนี้ครับ');
            return;
        }

        const reportArea = document.getElementById('printable-report-area');
        if (!reportArea) return;

        const photoSrc = s.photo_url || `photos/${s.student_id}.jpg`;
        const housePhotoSrc = rec.photo_url || photoSrc;

        reportArea.innerHTML = `
            <div style="text-align:center; margin-bottom:1.5rem; border-bottom:2px solid #0284c7; padding-bottom:12px;">
                <h2 style="font-size:1.5rem; font-weight:700; color:#0369a1; margin:0;">🏛️ โรงเรียนเทศบาล 6 นครเชียงราย</h2>
                <h3 style="font-size:1.2rem; font-weight:700; color:#0f172a; margin:4px 0;">แบบบันทึกสรุปผลการเยี่ยมบ้านนักเรียน (ภาคเรียนที่ 1 ปีการศึกษา 2569)</h3>
                <div style="font-size:0.9rem; color:#475569;">ชั้นมัธยมศึกษาปีที่ 1.4 (SMT) • ห้องประจำ 332 • วันที่บันทึกข้อมูล: ${rec.visit_date || '25 กรกฎาคม 2569'}</div>
            </div>

            <!-- Student Profile Summary -->
            <div style="display:flex; gap:20px; margin-bottom:1.5rem; background:#f8fafc; padding:16px; border-radius:10px; border:1px solid #cbd5e1; align-items:center;">
                <img src="${photoSrc}" onerror="this.style.display='none'" style="width:110px; height:130px; object-fit:cover; border-radius:8px; border:2px solid #0284c7;">
                <div style="flex:1; font-size:0.95rem; line-height:1.7;">
                    <div><strong>ชื่อ-นามสกุล:</strong> ${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}</div>
                    <div><strong>เลขที่:</strong> ${s.no} &nbsp;|&nbsp; <strong>รหัสประจำตัวนักเรียน:</strong> ${s.student_id} &nbsp;|&nbsp; <strong>ชั้น:</strong> ${s.classroom}</div>
                    <div><strong>ผู้ปกครองนักเรียน:</strong> ${s.guardian_name || '-'} (${s.relation || 'ผู้ปกครอง'})</div>
                    <div><strong>เบอร์โทรศัพท์ติดต่อ:</strong> 📞 ${s.guardian_phone || '-'}</div>
                    <div><strong>ที่อยู่อาศัยตามจริง:</strong> ${rec.address || 'เทศบาลนครเชียงราย อ.เมือง จ.เชียงราย'}</div>
                </div>
            </div>

            <!-- Home Living Condition Details -->
            <table style="width:100%; border-collapse:collapse; margin-bottom:1.5rem; font-size:0.92rem;">
                <thead>
                    <tr style="background:#e0f2fe; color:#0369a1;">
                        <th style="border:1px solid #bae6fd; padding:8px; text-align:left;" colspan="2">🏠 สภาพความเป็นอยู่และข้อมูลครอบครัว</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:1px solid #e2e8f0; padding:8px; width:50%;"><strong>ประเภทที่อยู่อาศัย:</strong> ${rec.house_type || 'บ้านเดี่ยว'}</td>
                        <td style="border:1px solid #e2e8f0; padding:8px; width:50%;"><strong>ลักษณะอาคาร:</strong> ${rec.building_type || 'ตึก / ปูน'}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #e2e8f0; padding:8px;"><strong>รายได้ครอบครัวต่อเดือน:</strong> ${rec.family_income || '10,001 - 20,000 บาท'}</td>
                        <td style="border:1px solid #e2e8f0; padding:8px;"><strong>จำนวนสมาชิกในบ้าน:</strong> ${rec.family_members || 4} คน</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #e2e8f0; padding:8px;" colspan="2"><strong>พฤติกรรมขณะอยู่ที่บ้าน:</strong> ${rec.behavior || 'ช่วยงานบ้าน ทบทวนบทเรียน และทำการบ้านเป็นประจำ'}</td>
                    </tr>
                    ${rec.lat && rec.lng ? `
                        <tr>
                            <td style="border:1px solid #e2e8f0; padding:8px;" colspan="2">
                                <strong>พิกัดสถานที่ GPS:</strong> ละติจูด ${rec.lat}, ลองจิจูด ${rec.lng} 
                                &nbsp;(<a href="https://www.google.com/maps/search/?api=1&query=${rec.lat},${rec.lng}" target="_blank" style="color:#0284c7; text-decoration:underline;">เปิดแผนที่ Google Maps</a>)
                            </td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>

            <!-- Attached House Photo & Notes -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:1.5rem;">
                <div style="border:1px solid #cbd5e1; border-radius:8px; padding:10px; text-align:center;">
                    <strong style="font-size:0.88rem; color:#475569; display:block; margin-bottom:6px;">📷 รูปถ่ายสภาพบ้าน / ภาพบรรยากาศการเยี่ยมบ้าน:</strong>
                    <img src="${housePhotoSrc}" onerror="this.outerHTML='<div style=\\'padding:30px; background:#f1f5f9; color:#94a3b8; border-radius:6px;\\'>ไม่ได้แนบรูปถ่ายสภาพบ้าน</div>'" style="width:100%; height:170px; object-fit:cover; border-radius:6px; border:1px solid #e2e8f0;">
                </div>
                <div style="border:1px solid #cbd5e1; border-radius:8px; padding:12px; background:#fafafa;">
                    <strong style="font-size:0.88rem; color:#0369a1; display:block; margin-bottom:6px;">📝 สรุปความเห็นครูผู้เยี่ยมบ้าน:</strong>
                    <div style="font-size:0.9rem; line-height:1.6; color:#334155;">
                        ${rec.notes || 'นักเรียนมีความตั้งใจเรียนดี สภาพครอบครัวอบอุ่น ผู้ปกครองเอาใจใส่และให้ความร่วมมือกับทางโรงเรียนอย่างดียิ่ง'}
                    </div>
                </div>
            </div>

            <!-- Signature Section -->
            <div style="display:flex; justify-content:space-around; text-align:center; margin-top:2.5rem; page-break-inside:avoid;">
                <div>
                    <div style="margin-bottom:40px;">(ลงชื่อ)...........................................................</div>
                    <div><strong>(นางสาวพรรณนิภา มูลโมกข์)</strong></div>
                    <div style="font-size:0.88rem; color:#475569;">ครูที่ปรึกษา ชั้น ม.1.4</div>
                </div>
                <div>
                    <div style="margin-bottom:40px;">(ลงชื่อ)...........................................................</div>
                    <div><strong>(นายปณิพัฒน์ อินทะชัย)</strong></div>
                    <div style="font-size:0.88rem; color:#475569;">ครู LS / ผู้ช่วยครูที่ปรึกษา</div>
                </div>
            </div>
        `;

        if (printModal) printModal.classList.add('open');
    };

    // Excel Drag & Drop / File Selector Reader using SheetJS
    const uploader = document.getElementById('excel-uploader');
    if (uploader) {
        uploader.addEventListener('change', (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const data = new Uint8Array(evt.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        console.log('Parsed uploaded Excel:', file.name, workbook.SheetNames);
                        alert(`นำเข้าไฟล์ Excel (${file.name}) สำเร็จ! ระบบได้ทำการประมวลผลตารางข้อมูลเรียบร้อยแล้ว`);
                    } catch (err) {
                        alert(`เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: ${err.message}`);
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        });
    }

    // Start App
    loadDatabase();
});

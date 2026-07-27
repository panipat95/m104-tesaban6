// Home Visit System JavaScript Logic for Class M.1/4 SMT
// School: Tesaban 6 Nakhon Chiang Rai School

const GOOGLE_APPS_SCRIPT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyPphz43aLcZAq_r6XYtTEHnmNQAViMg_gwBJ2e_eb2QMOrHPlM4zwPf-BT09ZYASyyNg/exec';

let currentVisitStep = 1;
let currentVisitMode = 'form'; // 'form' or 'admin'
let homeVisitStore = {}; // Key: student_id, Value: visit object

const ratingCategories = [
    { key: 'responsibility', title: '1. ความรับผิดชอบ' },
    { key: 'diligence', title: '2. ความขยันหมั่นเพียร' },
    { key: 'patience', title: '3. ความอดทน' },
    { key: 'discipline', title: '4. ความมีระเบียบวินัย' },
    { key: 'honesty', title: '5. ความซื่อสัตย์' },
    { key: 'kindness', title: '6. ความมีน้ำใจ/เอื้ออาทร' },
    { key: 'punctuality', title: '7. การตรงต่อเวลา' },
    { key: 'self_confidence', title: '8. ความมั่นใจในตนเอง' },
    { key: 'eager_to_learn', title: '9. การใฝ่หาความรู้' },
    { key: 'use_free_time', title: '10. การใช้เวลาว่างให้เกิดประโยชน์' }
];

document.addEventListener('DOMContentLoaded', () => {
    loadHomeVisitStore();
    populateStudentSelectOptions();
    renderRatingItemsGrid();
    renderAdminVisitDashboard();
});

// Load existing visits from LocalStorage
function loadHomeVisitStore() {
    try {
        const saved = localStorage.getItem('tesaban6_home_visits');
        if (saved) {
            homeVisitStore = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to parse home visit store:', e);
        homeVisitStore = {};
    }
}

// Save visits to LocalStorage
function saveHomeVisitStore() {
    try {
        localStorage.setItem('tesaban6_home_visits', JSON.stringify(homeVisitStore));
    } catch (e) {
        console.error('Failed to save home visit store:', e);
    }
}

// Populate student dropdown from real_db.js
function populateStudentSelectOptions() {
    const select = document.getElementById('select-visit-student');
    if (!select) return;

    select.innerHTML = '<option value="">-- กรุณาเลือกรายชื่อนักเรียน --</option>';

    if (typeof studentData !== 'undefined' && Array.isArray(studentData)) {
        studentData.forEach(s => {
            const hasData = homeVisitStore[s.student_id] ? ' 🟢 [กรอกแล้ว]' : '';
            const option = document.createElement('option');
            option.value = s.student_id;
            option.textContent = `เลขที่ ${s.no} | ${s.student_id} - ${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}${hasData}`;
            select.appendChild(option);
        });
    }
}

// Auto-fill student profile when selected
function handleStudentSelectChange() {
    const studentId = document.getElementById('select-visit-student').value;
    if (!studentId) return;

    const student = studentData.find(s => s.student_id.toString() === studentId.toString());
    if (!student) return;

    // Check if previous data exists for this student
    const existing = homeVisitStore[studentId];

    if (existing) {
        fillFormFromObject(existing);
        alert(`ℹ️ โหลดข้อมูลการเยี่ยมบ้านของ "${student.fullname}" ที่เคยกรอกไว้แล้วเรียบร้อย!`);
    } else {
        // Auto fill basic fields
        const elInformant = document.getElementById('v_informant_name');
        if (elInformant) elInformant.value = student.guardian_name || '';

        const elJob = document.getElementById('v_guardian_job');
        if (elJob && student.guardian_occupation) elJob.value = student.guardian_occupation;

        const elDream = document.getElementById('v_student_dream_job');
        if (elDream && student.dream) elDream.value = student.dream;
    }
}

// Render 10 Behavior Rating Items in Step 4
function renderRatingItemsGrid() {
    const container = document.getElementById('rating-items-container');
    if (!container) return;

    let html = '';
    ratingCategories.forEach(cat => {
        html += `
            <div class="rating-grid">
                <div><strong>${cat.title}</strong></div>
                <div style="text-align:center;"><input type="radio" name="rate_${cat.key}" value="ดี" checked></div>
                <div style="text-align:center;"><input type="radio" name="rate_${cat.key}" value="ปานกลาง"></div>
                <div style="text-align:center;"><input type="radio" name="rate_${cat.key}" value="ปรับปรุง"></div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Step Wizard Navigation
function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 4) return;
    
    // Check if student selected before moving past step 1
    const studentId = document.getElementById('select-visit-student').value;
    if (stepNumber > 1 && !studentId) {
        alert('⚠️ กรุณาเลือกรายชื่อนักเรียนในขั้นตอนที่ 1 ก่อนครับ!');
        return;
    }

    currentVisitStep = stepNumber;

    document.querySelectorAll('.wizard-step').forEach((btn, idx) => {
        btn.classList.remove('active');
        if (idx + 1 === stepNumber) btn.classList.add('active');
    });

    document.querySelectorAll('.step-content').forEach((content, idx) => {
        content.classList.remove('active');
        if (idx + 1 === stepNumber) content.classList.add('active');
    });

    window.scrollTo({ top: 120, behavior: 'smooth' });
}

// 1-Click GPS Location Pinning
function getCurrentGPSLocation() {
    const statusEl = document.getElementById('gps-status-result');
    if (statusEl) statusEl.textContent = '⏳ กำลังดึงพิกัด GPS จากอุปกรณ์...';

    if (!navigator.geolocation) {
        if (statusEl) statusEl.textContent = '❌ อุปกรณ์ไม่รองรับระบบระบุพิกัด GPS';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            document.getElementById('v_lat').value = lat;
            document.getElementById('v_lng').value = lng;

            if (statusEl) {
                statusEl.innerHTML = `✅ ดึงพิกัดสำเร็จ! ละติจูด: ${lat.toFixed(5)}, ลองจิจูด: ${lng.toFixed(5)} <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" style="color:#0284c7; font-weight:700;">[เปิดใน Google Maps]</a>`;
            }
        },
        (err) => {
            console.error('GPS Error:', err);
            if (statusEl) statusEl.textContent = '⚠️ ไม่สามารถดึงพิกัดอัตโนมัติได้ กรุณาเปิดการอนุญาตตำแหน่งบนมือถือ';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// Toggle Visit Mode (Form vs Admin Dashboard)
function toggleVisitMode() {
    currentVisitMode = currentVisitMode === 'form' ? 'admin' : 'form';
    
    const formContainer = document.getElementById('mode-form-container');
    const adminContainer = document.getElementById('mode-admin-container');
    const btnText = document.getElementById('text-mode-btn');

    if (currentVisitMode === 'admin') {
        formContainer.style.display = 'none';
        adminContainer.style.display = 'block';
        if (btnText) btnText.textContent = 'กลับไปยังแบบฟอร์มกรอกข้อมูล';
        renderAdminVisitDashboard();
    } else {
        formContainer.style.display = 'block';
        adminContainer.style.display = 'none';
        if (btnText) btnText.textContent = 'ดูแดชบอร์ดติดตาม (ครู)';
    }
}

// Handle Visit Form Submit
function handleVisitFormSubmit(event) {
    event.preventDefault();

    const studentId = document.getElementById('select-visit-student').value;
    if (!studentId) {
        alert('⚠️ กรุณาเลือกรายชื่อนักเรียนก่อนบันทึกข้อมูล!');
        return;
    }

    const student = studentData.find(s => s.student_id.toString() === studentId.toString());

    // Collect Form Values
    const visitData = {
        student_id: studentId,
        fullname: student ? student.fullname : '',
        no: student ? student.no : '',
        submitted_at: new Date().toLocaleString('th-TH'),
        lat: document.getElementById('v_lat').value || '',
        lng: document.getElementById('v_lng').value || '',
        house_no: document.getElementById('v_house_no').value || '',
        moo: document.getElementById('v_moo').value || '',
        village: document.getElementById('v_village').value || '',
        road: document.getElementById('v_road').value || '',
        subdistrict: document.getElementById('v_subdistrict').value || 'เวียง',
        district: document.getElementById('v_district').value || 'เมืองเชียงราย',
        province: document.getElementById('v_province').value || 'เชียงราย',
        housing_type: document.getElementById('v_housing_type').value,
        house_condition: document.getElementById('v_house_condition').value,
        family_members_count: document.getElementById('v_family_members_count').value,
        siblings_same_parents: document.getElementById('v_siblings_same_parents').value,
        family_relation: document.getElementById('v_family_relation').value,
        parent_status: document.getElementById('v_parent_status').value,
        living_with: document.getElementById('v_living_with').value,
        upbringing: document.getElementById('v_upbringing').value,
        guardian_job: document.getElementById('v_guardian_job').value,
        yearly_income: document.getElementById('v_yearly_income').value,
        income_expense_balance: document.getElementById('v_income_expense_balance').value,
        commute_method: document.getElementById('v_commute_method').value,
        distance_km: document.getElementById('v_distance_km').value,
        travel_time_mins: document.getElementById('v_travel_time_mins').value,
        daily_allowance: document.getElementById('v_daily_allowance').value,
        sleep_time: document.getElementById('v_sleep_time').value,
        wake_time: document.getElementById('v_wake_time').value,
        stay_overnight_freq: document.getElementById('v_stay_overnight_freq').value,
        gaming_freq: document.getElementById('v_gaming_freq').value,
        study_at_home_freq: document.getElementById('v_study_at_home_freq').value,
        parent_goal_m6: document.getElementById('v_parent_goal_m6').value,
        student_dream_job: document.getElementById('v_student_dream_job').value,
        friendship_ease: document.getElementById('v_friendship_ease').value,
        problem_solving_way: document.getElementById('v_problem_solving_way').value,
        parent_request_school: document.getElementById('v_parent_request_school').value || '',
        parent_comments: document.getElementById('v_parent_comments').value || '',
        informant_name: document.getElementById('v_informant_name').value || '',
        informant_relation: document.getElementById('v_informant_relation').value || ''
    };

    // Save locally
    homeVisitStore[studentId] = visitData;
    saveHomeVisitStore();

    // Submit to Google Apps Script Webhook Database
    submitVisitDataToGoogleScript(visitData);

    alert(`🎉 บันทึกข้อมูลการเยี่ยมบ้านของ "${student.fullname}" เรียบร้อยแล้ว!`);
    populateStudentSelectOptions();
    toggleVisitMode();
}

// Submit via Google Apps Script Webhook
function submitVisitDataToGoogleScript(visitData) {
    if (!GOOGLE_APPS_SCRIPT_WEBHOOK_URL) return;

    const payload = {
        action: 'save_home_visit',
        data: visitData
    };

    fetch(GOOGLE_APPS_SCRIPT_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(() => {
        console.log('Successfully sent visit data to Google Apps Script Webhook');
    }).catch(err => {
        console.error('Webhook post error:', err);
    });
}

// Fill form from object
function fillFormFromObject(obj) {
    if (!obj) return;
    Object.keys(obj).forEach(key => {
        const el = document.getElementById(`v_${key}`);
        if (el) el.value = obj[key];
    });
    if (obj.lat && obj.lng) {
        const statusEl = document.getElementById('gps-status-result');
        if (statusEl) {
            statusEl.innerHTML = `✅ มีพิกัดบันทึกไว้: ${parseFloat(obj.lat).toFixed(5)}, ${parseFloat(obj.lng).toFixed(5)} <a href="https://maps.google.com/?q=${obj.lat},${obj.lng}" target="_blank" style="color:#0284c7; font-weight:700;">[เปิดใน Google Maps]</a>`;
        }
    }
}

// Render Teacher Admin Visit Dashboard
function renderAdminVisitDashboard() {
    const tbody = document.querySelector('#table-visit-status tbody');
    const mapListContainer = document.getElementById('admin-gps-list-container');
    const doneCountBadge = document.getElementById('badge-visit-done-count');
    
    if (!tbody || typeof studentData === 'undefined') return;

    let completedCount = 0;
    let tableHtml = '';
    let mapListHtml = '';

    studentData.forEach(s => {
        const visit = homeVisitStore[s.student_id];
        const isDone = !!visit;
        if (isDone) completedCount++;

        const photoSrc = s.photo_url || `photos/${s.student_id}.jpg`;
        const addressText = isDone ? `บ้านเลขที่ ${visit.house_no} ม.${visit.moo || '-'} ต.${visit.subdistrict} อ.${visit.district}` : '-';
        
        let gpsCell = '<span style="color:#94a3b8;">ไม่มีพิกัด</span>';
        if (isDone && visit.lat && visit.lng) {
            const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${visit.lat},${visit.lng}`;
            gpsCell = `
                <a href="${mapUrl}" target="_blank" class="btn btn-outline" style="padding:4px 8px; font-size:0.78rem; background:#f0f9ff; color:#0284c7; border-color:#bae6fd;">
                    <i class="fa-solid fa-diamond-turn-right"></i> เปิดนำทาง GPS
                </a>
            `;

            mapListHtml += `
                <div class="admin-map-card">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${photoSrc}" onerror="this.style.display='none'" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid #0284c7;">
                        <div>
                            <strong style="color:#0f172a;">เลขที่ ${s.no} ${s.fullname}</strong> (${s.nickname || ''})
                            <div style="font-size:0.82rem; color:#64748b;">📍 ${addressText}</div>
                        </div>
                    </div>
                    <div>
                        <a href="${mapUrl}" target="_blank" class="btn btn-primary" style="padding:6px 12px; font-size:0.85rem;">
                            <i class="fa-solid fa-location-arrow"></i> นำทางไปบ้านนักเรียน
                        </a>
                    </div>
                </div>
            `;
        }

        tableHtml += `
            <tr>
                <td style="text-align:center; font-weight:700;">${s.no}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px; white-space:nowrap;">
                        <img src="${photoSrc}" onerror="this.style.display='none'" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid #0284c7;">
                        <strong>${s.fullname}</strong> ${s.nickname ? `<span style="color:#64748b;">(${s.nickname})</span>` : ''}
                    </div>
                </td>
                <td style="font-size:0.88rem;">${addressText}</td>
                <td style="text-align:center;">${gpsCell}</td>
                <td style="text-align:center;">
                    <span class="badge ${isDone ? 'badge-success' : 'badge-warning'}">
                        ${isDone ? '🟢 กรอกแล้ว' : '🟡 รอดำเนินการ'}
                    </span>
                </td>
                <td style="text-align:center;">
                    <button onclick="editStudentVisitData('${s.student_id}')" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;">
                        <i class="fa-solid fa-pen-to-square"></i> กรอก/แก้ไข
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = tableHtml;
    if (doneCountBadge) doneCountBadge.textContent = `เยี่ยมบ้านแล้ว ${completedCount} / ${studentData.length} คน`;
    
    if (mapListContainer) {
        mapListContainer.innerHTML = mapListHtml || `
            <div style="text-align:center; padding:2rem; color:#64748b; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1;">
                <i class="fa-solid fa-map-location-dot" style="font-size:2rem; color:#94a3b8; margin-bottom:8px;"></i>
                <p>ยังไม่มีพิกัด GPS บ้านนักเรียนที่บันทึกไว้ในขณะนี้</p>
            </div>
        `;
    }
}

// Edit specific student visit data from admin table
function editStudentVisitData(studentId) {
    toggleVisitMode();
    const select = document.getElementById('select-visit-student');
    if (select) {
        select.value = studentId;
        handleStudentSelectChange();
    }
}

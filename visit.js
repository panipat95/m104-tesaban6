// Home Visit System JavaScript Logic for Class M.1/4 SMT
// School: Tesaban 6 Nakhon Chiang Rai School

const GOOGLE_APPS_SCRIPT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyPphz43aLcZAq_r6XYtTEHnmNQAViMg_gwBJ2e_eb2QMOrHPlM4zwPf-BT09ZYASyyNg/exec';

let currentVisitStep = 1;
let homeVisitStore = {}; // Key: student_id, Value: visit object
let ratingSelections = {}; // Key: catKey, Value: 'ดี' | 'ปานกลาง' | 'ปรับปรุง'

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

// Helper to retrieve active student list from window.REAL_STUDENT_DB or global studentData
function getVisitStudentList() {
    if (typeof window.REAL_STUDENT_DB !== 'undefined' && Array.isArray(window.REAL_STUDENT_DB) && window.REAL_STUDENT_DB.length > 0) {
        return window.REAL_STUDENT_DB;
    }
    if (typeof studentData !== 'undefined' && Array.isArray(studentData) && studentData.length > 0) {
        return studentData;
    }
    return [];
}

document.addEventListener('DOMContentLoaded', () => {
    loadHomeVisitStore();
    populateStudentSelectOptions();
    renderRatingItemsGrid();
    updateProgressBar();
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
    const students = getVisitStudentList();

    if (students && students.length > 0) {
        students.forEach(s => {
            const hasData = homeVisitStore[s.student_id] ? ' 🟢 [กรอกแล้ว]' : '';
            const option = document.createElement('option');
            option.value = s.student_id;
            option.textContent = `เลขที่ ${s.no} | ${s.student_id} - ${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}${hasData}`;
            select.appendChild(option);
        });
    }
}

// Auto-fill student profile banner when selected
function handleStudentSelectChange() {
    const studentId = document.getElementById('select-visit-student').value;
    const bannerContainer = document.getElementById('student-profile-banner-container');
    
    if (!studentId) {
        if (bannerContainer) bannerContainer.style.display = 'none';
        return;
    }

    const students = getVisitStudentList();
    const student = students.find(s => s.student_id.toString() === studentId.toString());
    if (!student) return;

    const existing = homeVisitStore[studentId];
    const photoSrc = student.photo_url || `photos/${student.student_id}.jpg`;

    if (bannerContainer) {
        bannerContainer.style.display = 'flex';
        bannerContainer.innerHTML = `
            <img src="${photoSrc}" onerror="this.src='photos/19186.jpg'" style="width: 58px; height: 58px; border-radius: 50%; object-fit: cover; border: 2px solid #0284c7; flex-shrink:0;">
            <div style="flex: 1;">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom: 2px;">
                    <h3 style="color:#0f172a; font-weight:700; font-size:1.15rem; margin:0;">${student.fullname}</h3>
                    ${student.nickname ? `<span class="badge badge-blue">น้อง${student.nickname}</span>` : ''}
                    <span class="badge badge-purple">เลขที่ ${student.no}</span>
                    <span class="badge ${existing ? 'badge-success' : 'badge-warning'}">
                        ${existing ? '🟢 เคยกรอกข้อมูลเยี่ยมบ้านแล้ว' : '🟡 รอกรอกข้อมูล'}
                    </span>
                </div>
                <div style="font-size:0.88rem; color:#64748b;">
                    <strong>รหัสประจำตัว:</strong> ${student.student_id} | <strong>ชั้น:</strong> ม.1/4 ห้อง 332 | <strong>ผู้ปกครอง:</strong> ${student.guardian_name || '-'}
                </div>
            </div>
        `;
    }

    if (existing) {
        fillFormFromObject(existing);
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

// Render Interactive 10 Behavior Rating Items in Step 4
function renderRatingItemsGrid() {
    const container = document.getElementById('rating-items-container');
    if (!container) return;

    let html = '';
    ratingCategories.forEach(cat => {
        const val = ratingSelections[cat.key] || 'ดี';
        html += `
            <div class="rating-segmented-row">
                <div><strong>${cat.title}</strong></div>
                <div class="segmented-btn-group" style="grid-column: span 3;">
                    <button type="button" class="segmented-btn ${val === 'ดี' ? 'selected-green' : ''}" onclick="selectRatingScore('${cat.key}', 'ดี')">
                        🟢 ดี
                    </button>
                    <button type="button" class="segmented-btn ${val === 'ปานกลาง' ? 'selected-yellow' : ''}" onclick="selectRatingScore('${cat.key}', 'ปานกลาง')">
                        🟡 ปานกลาง
                    </button>
                    <button type="button" class="segmented-btn ${val === 'ปรับปรุง' ? 'selected-red' : ''}" onclick="selectRatingScore('${cat.key}', 'ปรับปรุง')">
                        🔴 ปรับปรุง
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Select rating score callback
function selectRatingScore(catKey, level) {
    ratingSelections[catKey] = level;
    renderRatingItemsGrid();
}

// Step Wizard Navigation
function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 4) return;
    
    const studentId = document.getElementById('select-visit-student').value;
    if (stepNumber > 1 && !studentId) {
        alert('⚠️ กรุณาเลือกรายชื่อนักเรียนในขั้นตอนที่ 1 ก่อนครับ!');
        return;
    }

    currentVisitStep = stepNumber;

    document.querySelectorAll('.wizard-step').forEach((btn, idx) => {
        btn.classList.remove('active');
        if (idx + 1 < stepNumber) btn.classList.add('completed');
        if (idx + 1 === stepNumber) btn.classList.add('active');
    });

    document.querySelectorAll('.step-content').forEach((content, idx) => {
        content.classList.remove('active');
        if (idx + 1 === stepNumber) content.classList.add('active');
    });

    updateProgressBar();
    window.scrollTo({ top: 120, behavior: 'smooth' });
}

// Update progress bar percentage
function updateProgressBar() {
    const fillEl = document.getElementById('form-progress-fill');
    if (!fillEl) return;
    const pct = currentVisitStep * 25;
    fillEl.style.width = `${pct}%`;
}

// 1-Click GPS Location Pinning
function getCurrentGPSLocation() {
    const statusEl = document.getElementById('gps-status-result');
    if (statusEl) statusEl.innerHTML = '⏳ กำลังดึงพิกัด GPS จากสมาร์ตโฟนของคุณ...';

    if (!navigator.geolocation) {
        if (statusEl) statusEl.textContent = '❌ อุปกรณ์ของคุณไม่รองรับระบบระบุพิกัด GPS';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            document.getElementById('v_lat').value = lat;
            document.getElementById('v_lng').value = lng;

            if (statusEl) {
                statusEl.innerHTML = `
                    <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:10px; padding:8px 12px; display:inline-block; margin-top:6px;">
                        🎉 ดึงพิกัดสำเร็จ! 
                        <span class="gps-chip">Lat: ${lat.toFixed(5)}</span>
                        <span class="gps-chip">Lng: ${lng.toFixed(5)}</span>
                        <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" class="btn btn-outline" style="padding:2px 8px; font-size:0.8rem; background:#fff; border-color:#0284c7; color:#0284c7; margin-left:6px;">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> เปิดใน Google Maps
                        </a>
                    </div>
                `;
            }
        },
        (err) => {
            console.error('GPS Error:', err);
            if (statusEl) statusEl.textContent = '⚠️ ไม่สามารถดึงพิกัดได้ กรุณาเปิดการอนุญาตตำแหน่ง (Location Access) บนเบราว์เซอร์มือถือ';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// Reset form state cleanly
function resetFormState() {
    const form = document.getElementById('form-home-visit');
    if (form) form.reset();
    document.getElementById('select-visit-student').value = '';
    document.getElementById('student-profile-banner-container').style.display = 'none';
    document.getElementById('gps-status-result').innerHTML = '';
    ratingSelections = {};
    renderRatingItemsGrid();
    goToStep(1);
}

// Handle Visit Form Submit
function handleVisitFormSubmit(event) {
    event.preventDefault();

    const studentId = document.getElementById('select-visit-student').value;
    if (!studentId) {
        alert('⚠️ กรุณาเลือกรายชื่อนักเรียนก่อนบันทึกข้อมูล!');
        return;
    }

    const students = getVisitStudentList();
    const student = students.find(s => s.student_id.toString() === studentId.toString());

    // Collect selected study problems
    const selectedProblems = [];
    document.querySelectorAll('input[name="v_study_problems"]:checked').forEach(cb => {
        selectedProblems.push(cb.value);
    });

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
        study_problems: selectedProblems.join(', '),
        rating_scores: ratingSelections,
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

    alert(`🎉 บันทึกข้อมูลการเยี่ยมบ้านของ "${student ? student.fullname : ''}" เรียบร้อยแล้ว! ขอบคุณครับ`);
    populateStudentSelectOptions();
    resetFormState();
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

    if (obj.rating_scores) {
        ratingSelections = obj.rating_scores;
        renderRatingItemsGrid();
    }

    if (obj.lat && obj.lng) {
        const statusEl = document.getElementById('gps-status-result');
        if (statusEl) {
            statusEl.innerHTML = `
                <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:10px; padding:8px 12px; display:inline-block; margin-top:6px;">
                    ✅ มีพิกัดบันทึกไว้: 
                    <span class="gps-chip">Lat: ${parseFloat(obj.lat).toFixed(5)}</span>
                    <span class="gps-chip">Lng: ${parseFloat(obj.lng).toFixed(5)}</span>
                    <a href="https://maps.google.com/?q=${obj.lat},${obj.lng}" target="_blank" class="btn btn-outline" style="padding:2px 8px; font-size:0.8rem; background:#fff; border-color:#0284c7; color:#0284c7; margin-left:6px;">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> เปิดใน Google Maps
                    </a>
                </div>
            `;
        }
    }
}

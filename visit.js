// Home Visit System JavaScript Logic for Class M.1/4 SMT
// School: Tesaban 6 Nakhon Chiang Rai School

const GOOGLE_APPS_SCRIPT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyPphz43aLcZAq_r6XYtTEHnmNQAViMg_gwBJ2e_eb2QMOrHPlM4zwPf-BT09ZYASyyNg/exec';

let currentVisitStep = 1;
let homeVisitStore = {}; // Key: student_id, Value: visit object
let ratingSelections = {}; // Key: catKey, Value: 'ดี' | 'ปานกลาง' | 'ปรับปรุง'

// Official Chiang Rai Province Geographic Dictionary (18 Districts & 124 Subdistricts)
const chiangRaiGeography = {
    'เมืองเชียงราย': ['เวียง', 'รอบเวียง', 'บ้านดู่', 'นางแล', 'แม่ข้าวต้ม', 'แม่ยาว', 'ห้วยชมภู', 'ห้วยสัก', 'ดอยฮาง', 'ดอยลาน', 'ป่าอ้อดอนชัย', 'ท่าสาย', 'ท่าสุด', 'สันทราย', 'แม่กรณ์', 'ริมกก'],
    'เวียงชัย': ['เวียงชัย', 'ผางาม', 'เวียงเหนือ', 'ดอนศิลา', 'เมืองชุม'],
    'เชียงของ': ['เวียง', 'สถาน', 'ครึ่ง', 'บุญเรือง', 'ห้วยซ้อ', 'ศรีดอนชัย', 'ริมโขง'],
    'เทิง': ['เวียง', 'งิ้ว', 'ปล้อง', 'แม่ลอย', 'เชียงเคี่ยน', 'ตับเต่า', 'หงาว', 'สันทรายงาม', 'ศรีดอนไชย', 'หนองป่าก่อ'],
    'พาน': ['สันกว๊าน', 'พาน', 'แม่อ้อ', 'ม่วงคำ', 'เวียงห้าว', 'สันกลาง', 'สันมะเค็ด', 'ป่าหุ่ง', 'ม่วงตึ๊ด', 'หัวง้ม', 'เจริญเมือง', 'ป่าแดด', 'เมืองพาน', 'ทานตะวัน', 'ดอยงาม'],
    'ป่าแดด': ['ป่าแดด', 'ป่าแงะ', 'สันมะค่า', 'โรงช้าง', 'ศรีโพธิ์เงิน'],
    'แม่จัน': ['แม่จัน', 'จันจว้า', 'แม่คำ', 'ป่าซาง', 'สันทราย', 'ท่าข้าวเปลือก', 'แม่ไร่', 'ศรีค้ำ', 'จันจว้าใต้', 'จอมสวรรค์', 'ป่าตึง'],
    'เชียงแสน': ['เวียง', 'ป่ากั่ว', 'บ้านแซว', 'แม่เงิน', 'โยนก', 'ศรีดอนมูน'],
    'แม่สาย': ['แม่สาย', 'ห้วยไคร้', 'เกาะช้าง', 'โป่งผา', 'โป่งงาม', 'เวียงพางคำ', 'บ้านด้าย', 'ศิลาแลง'],
    'แม่สรวย': ['แม่สรวย', 'ป่าแดด', 'แม่พริก', 'ศรีถ้อย', 'ท่าก๊อ', 'วาวี', 'เจดีย์หลวง'],
    'เวียงป่าเป้า': ['เวียง', 'บ้านดง', 'ป่างิ้ว', 'เวียงกาหลง', 'แม่เจดีย์', 'แม่เจดีย์ใหม่', 'สันสลี'],
    'พญาเม็งราย': ['แม่เปา', 'แม่ต๋ำ', 'ไม้ยา', 'เม็งราย', 'ตาดควัน'],
    'เวียงแก่น': ['ม่วงยาย', 'ปอ', 'หล่ายงาว', 'ท่าข้าม'],
    'ขุนตาล': ['ต้า', 'ป่าตาล', 'ยางฮอม'],
    'แม่ฟ้าหลวง': ['เทอดไทย', 'แม่สลองนอก', 'แม่สลองใน', 'แม่ฟ้าหลวง'],
    'แม่ลาว': ['ดงมะดะ', 'จอมหมอกแก้ว', 'บัวสลี', 'ป่าก่อดำ', 'โป่งแพ่ง'],
    'เวียงเชียงรุ้ง': ['ทุ่งก่อ', 'ดงมหาวัน', 'ป่าซาง'],
    'ดอยหลวง': ['พร้าว', 'โชคชัย', 'หนองป่าก่อ']
};

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
    initAddressDropdowns();
    renderRatingItemsGrid();
    updateProgressBar();
    goToStep(1); // Set initial step state cleanly
});

// Official Thailand 77 Provinces Array
const thailandProvinces = [
    'เชียงราย', 'กรุงเทพมหานคร',
    'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี',
    'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม',
    'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ',
    'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา',
    'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'ภูเก็ต', 'มหาสารคาม',
    'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี',
    'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม',
    'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์',
    'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี'
];

// Populate 77 Provinces Dropdown
function populateProvinceOptions(selectedProv = 'เชียงราย') {
    const provSelect = document.getElementById('v_province');
    if (!provSelect) return;

    provSelect.innerHTML = '';
    thailandProvinces.forEach(prov => {
        const opt = document.createElement('option');
        opt.value = prov;
        opt.textContent = (prov === 'กรุงเทพมหานคร') ? prov : `จังหวัด${prov}`;
        if (prov === selectedProv) opt.selected = true;
        provSelect.appendChild(opt);
    });
}

// Initialize Address Cascading Dropdowns for Chiang Rai & Other Provinces
function initAddressDropdowns(selectedProv = 'เชียงราย', selectedDistrict = 'เมืองเชียงราย', selectedSubdistrict = 'เวียง') {
    populateProvinceOptions(selectedProv);
    handleProvinceChange(selectedDistrict, selectedSubdistrict);
}

// Populate Chiang Rai District Options
function populateChiangRaiDistricts(targetDistrict = 'เมืองเชียงราย', targetSubdistrict = 'เวียง') {
    const districtSelect = document.getElementById('v_district');
    if (!districtSelect) return;

    districtSelect.innerHTML = '';
    const districts = Object.keys(chiangRaiGeography);

    districts.forEach(dist => {
        const option = document.createElement('option');
        option.value = dist;
        option.textContent = `อำเภอ${dist}`;
        if (dist === targetDistrict) option.selected = true;
        districtSelect.appendChild(option);
    });

    populateChiangRaiSubdistricts(districtSelect.value || targetDistrict, targetSubdistrict);
}

// Populate Chiang Rai Subdistrict Options based on selected District
function populateChiangRaiSubdistricts(districtName, targetSubdistrict = 'เวียง') {
    const subdistrictSelect = document.getElementById('v_subdistrict');
    if (!subdistrictSelect) return;

    subdistrictSelect.innerHTML = '';
    const subdistricts = chiangRaiGeography[districtName] || [];

    subdistricts.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.textContent = `ตำบล${sub}`;
        if (sub === targetSubdistrict) option.selected = true;
        subdistrictSelect.appendChild(option);
    });
}

// Handle Province Change Event (Switch between Chiang Rai dropdowns vs Free text input for 76 other provinces)
function handleProvinceChange(targetDistrict = '', targetSubdistrict = '') {
    const provSelect = document.getElementById('v_province');
    const wrapperDist = document.getElementById('wrapper_district');
    const wrapperSub = document.getElementById('wrapper_subdistrict');

    if (!provSelect) return;

    const prov = provSelect.value;

    if (prov === 'เชียงราย') {
        if (wrapperDist) wrapperDist.innerHTML = `<select id="v_district" class="form-control" onchange="handleDistrictChange()"></select>`;
        if (wrapperSub) wrapperSub.innerHTML = `<select id="v_subdistrict" class="form-control"></select>`;
        populateChiangRaiDistricts(targetDistrict || 'เมืองเชียงราย', targetSubdistrict || 'เวียง');
    } else {
        // Free text input for other provinces
        if (wrapperDist) wrapperDist.innerHTML = `<input type="text" id="v_district" class="form-control" placeholder="กรอกชื่อ อำเภอ/เขต" value="${targetDistrict}" required>`;
        if (wrapperSub) wrapperSub.innerHTML = `<input type="text" id="v_subdistrict" class="form-control" placeholder="กรอกชื่อ ตำบล/แขวง" value="${targetSubdistrict}" required>`;
    }
}

// Handle District Change Event
function handleDistrictChange() {
    const districtSelect = document.getElementById('v_district');
    if (districtSelect && districtSelect.tagName === 'SELECT') {
        populateChiangRaiSubdistricts(districtSelect.value);
    }
}

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
                    <strong>รหัสประจำตัว:</strong> ${student.student_id} | <strong>ชั้น:</strong> ม.1/4 ห้อง 332
                </div>
            </div>
        `;
    }

    if (existing) {
        fillFormFromObject(existing);
    } else {
        // Auto fill basic non-sensitive fields
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

// Validate current step required fields before advancing
function validateCurrentStep(stepNum) {
    const currentStepEl = document.getElementById(`step-${stepNum}`);
    if (!currentStepEl) return true;

    // Clear old error alerts and red highlights in current step
    currentStepEl.querySelectorAll('.step-validation-error-alert').forEach(el => el.remove());
    currentStepEl.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

    let missingFields = [];

    if (stepNum === 1) {
        const requiredIds = ['v_house_no', 'v_province', 'v_district', 'v_subdistrict'];
        requiredIds.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.value.trim()) {
                missingFields.push(el);
            }
        });
    } else if (stepNum === 2) {
        const requiredIds = ['v_guardian_job', 'v_yearly_income', 'v_commute_method', 'v_daily_allowance'];
        requiredIds.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.value.trim()) {
                missingFields.push(el);
            }
        });
    } else if (stepNum === 3) {
        const requiredIds = ['v_student_dream_job'];
        requiredIds.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.value.trim()) {
                missingFields.push(el);
            }
        });
    } else if (stepNum === 4) {
        const requiredIds = ['v_informant_name', 'v_informant_phone'];
        requiredIds.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.value.trim()) {
                missingFields.push(el);
            }
        });

        if (typeof ratingCategories !== 'undefined' && Array.isArray(ratingCategories)) {
            const missingRatings = ratingCategories.filter(cat => !ratingSelections[cat.key]);
            if (missingRatings.length > 0) {
                const ratingContainer = document.getElementById('rating-items-container');
                if (ratingContainer) missingFields.push(ratingContainer);
            }
        }
    }

    if (missingFields.length > 0) {
        // Highlight missing fields with Red Error Border
        missingFields.forEach(el => {
            el.classList.add('input-error');
            const clearError = () => el.classList.remove('input-error');
            el.addEventListener('input', clearError, { once: true });
            el.addEventListener('change', clearError, { once: true });
        });

        // Insert Red Alert Notification at top of step card
        const alertEl = document.createElement('div');
        alertEl.className = 'step-validation-error-alert';
        alertEl.style.cssText = 'background:#fff1f2; border:2px solid #f87171; color:#991b1b; padding:12px 16px; border-radius:14px; margin-bottom:14px; font-weight:600; display:flex; align-items:center; gap:8px; animation:shakeError 0.35s ease-in-out;';
        alertEl.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="font-size:1.2rem; color:#ef4444;"></i> ⚠️ กรุณากรอกข้อมูลในช่องที่มีแถบสีแดงให้ครบถ้วนก่อนไปขั้นตอนถัดไปครับ!';

        const containerCard = currentStepEl.querySelector('.card') || currentStepEl;
        const headerEl = containerCard.querySelector('.form-section-header');
        if (headerEl) {
            containerCard.insertBefore(alertEl, headerEl);
        } else {
            containerCard.prepend(alertEl);
        }

        // Smooth scroll to the first missing element
        const firstEl = missingFields[0];
        if (firstEl) {
            firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof firstEl.focus === 'function') firstEl.focus();
        }

        return false;
    }

    return true;
}

// Step Wizard Navigation (Fix Back button & smooth step switching)
function goToStep(stepNumber) {
    const targetStep = parseInt(stepNumber, 10);
    if (isNaN(targetStep) || targetStep < 1 || targetStep > 4) return;
    
    // Check studentId when moving FORWARD
    const selectEl = document.getElementById('select-visit-student');
    const studentId = selectEl ? selectEl.value : '';
    
    if (targetStep > currentVisitStep && targetStep > 1 && !studentId && typeof currentStudent === 'undefined') {
        alert('⚠️ กรุณาเลือกรายชื่อนักเรียนในขั้นตอนที่ 1 ก่อนครับ!');
        return;
    }

    // Validate current and intermediate steps when moving FORWARD!
    if (targetStep > currentVisitStep) {
        for (let s = currentVisitStep; s < targetStep; s++) {
            if (!validateCurrentStep(s)) {
                return; // Stop step navigation if validation fails!
            }
        }
    }

    currentVisitStep = targetStep;

    // Update wizard step buttons
    document.querySelectorAll('.wizard-step').forEach((btn, idx) => {
        btn.classList.remove('active');
        btn.classList.remove('completed');
        if (idx + 1 < targetStep) {
            btn.classList.add('completed');
        } else if (idx + 1 === targetStep) {
            btn.classList.add('active');
        }
    });

    // Update step content visibility cleanly
    document.querySelectorAll('.step-content').forEach((content, idx) => {
        if (idx + 1 === targetStep) {
            content.classList.add('active');
            content.style.display = 'block';
        } else {
            content.classList.remove('active');
            content.style.display = 'none';
        }
    });

    updateProgressBar();

    // Scroll smoothly to top of wizard nav
    const wizardNav = document.querySelector('.wizard-nav') || document.getElementById('form-home-visit');
    if (wizardNav) {
        wizardNav.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    initAddressDropdowns();
    goToStep(1);
}

// Handle Visit Form Submit
function handleVisitFormSubmit(event) {
    event.preventDefault();

    // Validate step 4 fields first
    if (!validateCurrentStep(4)) {
        return;
    }

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
        informant_relation: document.getElementById('v_informant_relation').value || '',
        informant_phone: document.getElementById('v_informant_phone') ? document.getElementById('v_informant_phone').value || '' : ''
    };

    // Save locally
    homeVisitStore[studentId] = visitData;
    saveHomeVisitStore();

    // Submit to Google Apps Script Webhook Database
    submitVisitDataToGoogleScript(visitData);

    alert(`🎉 บันทึกข้อมูลการเยี่ยมบ้านของ "${student ? student.fullname : ''}" เรียบร้อยแล้ว! ขอบคุณครับ`);

    if (typeof currentStudent !== 'undefined' && currentStudent) {
        window.editingHomeVisitMode = false;
        renderParentHomeVisitTab();
        return;
    }

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

    initAddressDropdowns(obj.province || 'เชียงราย', obj.district || 'เมืองเชียงราย', obj.subdistrict || 'เวียง');

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

// Global state for Parent Portal Home Visit tab edit mode
window.editingHomeVisitMode = false;

window.renderParentHomeVisitTab = function() {
    const container = document.getElementById('home-visit-tab-container');
    if (!container || typeof currentStudent === 'undefined' || !currentStudent) return;

    const studentId = currentStudent.student_id.toString();
    const existing = homeVisitStore[studentId];

    if (existing && !window.editingHomeVisitMode) {
        const lat = existing.lat ? parseFloat(existing.lat).toFixed(5) : null;
        const lng = existing.lng ? parseFloat(existing.lng).toFixed(5) : null;

        container.innerHTML = `
            <div style="background:linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%); border:2px solid #86efac; border-radius:18px; padding:20px; box-shadow:0 6px 20px rgba(34,197,94,0.12);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
                    <div>
                        <span class="badge badge-success" style="font-size:0.9rem; padding:6px 14px; background:#dcfce7; color:#15803d; border:1px solid #86efac;">
                            🟢 กรอกข้อมูลเยี่ยมบ้านเรียบร้อยแล้ว
                        </span>
                        <h3 style="color:#14532d; font-size:1.2rem; font-weight:700; margin-top:10px; margin-bottom:2px;">
                            🏠 บันทึกข้อมูลการเยี่ยมบ้านของ ${currentStudent.fullname}
                        </h3>
                        <p style="color:#166534; font-size:0.88rem; margin:0;">
                            ข้อมูลถูกบันทึกในระบบเรียบร้อยแล้ว คุณครูประจำชั้นนำไปใช้วางแผนการเยี่ยมบ้านต่อไปเรียบร้อยครับ
                        </p>
                    </div>
                    <button class="btn btn-pink" onclick="window.editingHomeVisitMode=true; renderParentHomeVisitTab();" style="width:auto; padding:8px 18px; font-size:0.88rem; font-weight:600;">
                        <i class="fa-solid fa-pen-to-square"></i> ดู / แก้ไขข้อมูล
                    </button>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; background:#ffffff; border:1px solid #dcfce7; padding:14px; border-radius:14px; font-size:0.88rem; margin-top:12px;">
                    <div><strong>👤 ผู้ให้ข้อมูล:</strong> ${existing.informant_name || '-'} (${existing.informant_relation || 'ผู้ปกครอง'})</div>
                    <div><strong>📞 เบอร์โทรติดต่อ:</strong> ${existing.informant_phone || '-'}</div>
                    <div><strong>📍 อำเภอ/ตำบล:</strong> อ.${existing.district || 'เมืองเชียงราย'} ต.${existing.subdistrict || 'เวียง'}</div>
                    <div><strong>💼 อาชีพผู้ปกครอง:</strong> ${existing.guardian_job || '-'}</div>
                </div>

                ${(lat && lng) ? `
                    <div style="margin-top:14px; background:#f0fdf4; border:1px solid #bbf7d0; padding:12px 16px; border-radius:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div>
                            <strong style="color:#166534; font-size:0.9rem;"><i class="fa-solid fa-location-dot" style="color:#ef4444;"></i> พิกัด GPS บ้านนักเรียน:</strong>
                            <span class="gps-chip" style="margin-left:6px;">Lat: ${lat}</span>
                            <span class="gps-chip">Lng: ${lng}</span>
                        </div>
                        <a href="https://maps.google.com/?q=${existing.lat},${existing.lng}" target="_blank" class="btn" style="width:auto; padding:6px 14px; font-size:0.82rem; background:#0284c7; color:#fff; text-decoration:none;">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> เปิดใน Google Maps
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        container.innerHTML = generateParentWizardHTML(currentStudent, existing);
        initAddressDropdowns(existing ? existing.district : 'เมืองเชียงราย', existing ? existing.subdistrict : 'เวียง');
        renderRatingItemsGrid();
        updateProgressBar();
        goToStep(1);
        if (existing) fillFormFromObject(existing);
    }
};

function generateParentWizardHTML(student, existing) {
    return `
        <div>
            <!-- Status Header Banner -->
            <div style="background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border:1px solid #bae6fd; padding:16px; border-radius:16px; margin-bottom:1.4rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>
                    <span class="badge ${existing ? 'badge-success' : 'badge-warning'}" style="font-size:0.85rem; padding:4px 12px; margin-bottom:4px; display:inline-block;">
                        ${existing ? '🟢 เคยกรอกข้อมูลเยี่ยมบ้านแล้ว (กำลังแก้ไข)' : '🟡 รอกรอกข้อมูลแบบบันทึกเยี่ยมบ้าน'}
                    </span>
                    <h3 style="color:#0369a1; font-size:1.15rem; font-weight:700; margin:0;">
                        🏠 แบบบันทึกข้อมูลการเยี่ยมบ้านนักเรียน ม.1/4
                    </h3>
                    <p style="color:#64748b; font-size:0.85rem; margin:2px 0 0 0;">
                        🔒 นักเรียน: <strong>${student.fullname}</strong> (เลขที่ ${student.no} | รหัส: ${student.student_id})
                    </p>
                </div>
                ${existing ? `
                    <button class="btn btn-slate" onclick="window.editingHomeVisitMode=false; renderParentHomeVisitTab();" style="width:auto; padding:6px 14px; font-size:0.8rem;">
                        <i class="fa-solid fa-xmark"></i> ยกเลิกการแก้ไข
                    </button>
                ` : ''}
            </div>

            <!-- Progress Bar -->
            <div class="progress-bar-container">
                <div class="progress-bar-fill" id="form-progress-fill"></div>
            </div>

            <!-- Wizard Navigation -->
            <div class="wizard-nav">
                <div class="wizard-step active" id="step-btn-1" onclick="goToStep(1)">
                    <i class="fa-solid fa-house-chimney"></i> <span>1. ที่อยู่ & ครอบครัว</span>
                </div>
                <div class="wizard-step" id="step-btn-2" onclick="goToStep(2)">
                    <i class="fa-solid fa-coins"></i> <span>2. รายได้ & การเดินทาง</span>
                </div>
                <div class="wizard-step" id="step-btn-3" onclick="goToStep(3)">
                    <i class="fa-solid fa-book-open"></i> <span>3. การเรียน & เพื่อน</span>
                </div>
                <div class="wizard-step" id="step-btn-4" onclick="goToStep(4)">
                    <i class="fa-solid fa-star"></i> <span>4. ประเมิน & สรุป</span>
                </div>
            </div>

            <form id="form-home-visit" onsubmit="handleVisitFormSubmit(event)">
                <!-- Hidden Student ID for locked session -->
                <input type="hidden" id="select-visit-student" value="${student.student_id}">

                <!-- Step 1: Address & Family -->
                <div class="step-content active" id="step-1" style="display: block;">
                    <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:1.2rem;">
                        <div class="form-section-header">
                            <i class="fa-solid fa-location-dot" style="color: #0284c7;"></i> ข้อมูลที่อยู่ปัจจุบัน & ปักหมุดพิกัด GPS บ้านนักเรียน
                        </div>

                        <!-- GPS Pinpoint Box -->
                        <div class="gps-card-container">
                            <div style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: #e0f2fe; border-radius: 50%; color: #0284c7; margin-bottom: 8px;">
                                <i class="fa-solid fa-location-crosshairs" style="font-size: 1.4rem;"></i>
                            </div>
                            <h4 style="color: #0369a1; font-weight: 700; margin-bottom: 4px; font-size: 1rem;">
                                📍 ดึงพิกัด GPS ตำแหน่งบ้านปัจจุบัน
                            </h4>
                            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 10px;">
                                กดปุ่มด้านล่างในขณะที่ผู้ปกครองหรือนักเรียนอยู่ที่บ้าน เพื่อบันทึกพิกัดให้คุณครูนำทางไปเยี่ยมบ้านได้อย่างแม่นยำ
                            </p>
                            <button type="button" class="btn btn-pink" onclick="getCurrentGPSLocation()" style="padding: 10px 20px; font-size: 0.92rem; width:auto;">
                                <i class="fa-solid fa-crosshairs"></i> กดดึงพิกัด GPS บ้านปัจจุบัน 📍
                            </button>
                            <div id="gps-status-result" style="margin-top: 8px; font-weight: 600; font-size: 0.88rem; color: #059669;"></div>
                            <input type="hidden" id="v_lat" name="v_lat">
                            <input type="hidden" id="v_lng" name="v_lng">
                        </div>

                        <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                            <div class="form-group">
                                <label>บ้านเลขที่ <span style="color:#ef4444;">*</span></label>
                                <input type="text" id="v_house_no" class="form-control" placeholder="เช่น 123/45" required>
                            </div>
                            <div class="form-group">
                                <label>หมู่ที่</label>
                                <input type="text" id="v_moo" class="form-control" placeholder="เช่น 5">
                            </div>
                            <div class="form-group">
                                <label>หมู่บ้าน / อาคาร / ชุมชน</label>
                                <input type="text" id="v_village" class="form-control" placeholder="เช่น ชุมชนศรีทรายมูล">
                            </div>
                            <div class="form-group">
                                <label>ถนน / ซอย</label>
                                <input type="text" id="v_road" class="form-control" placeholder="เช่น ถนนพหลโยธิน">
                            </div>
                            <div class="form-group">
                                <label>จังหวัด <span style="color:#ef4444;">*</span></label>
                                <select id="v_province" class="form-control" onchange="handleProvinceChange()">
                                </select>
                            </div>
                            <div class="form-group">
                                <label>อำเภอ / เขต <span style="color:#ef4444;">*</span></label>
                                <div id="wrapper_district">
                                    <select id="v_district" class="form-control" onchange="handleDistrictChange()"></select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>ตำบล / แขวง <span style="color:#ef4444;">*</span></label>
                                <div id="wrapper_subdistrict">
                                    <select id="v_subdistrict" class="form-control"></select>
                                </div>
                            </div>
                        </div>

                        <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 10px;">
                            <div class="form-group">
                                <label>สถานะที่อยู่อาศัย</label>
                                <select id="v_housing_type" class="form-control">
                                    <option value="ของตนเอง">ของตนเอง</option>
                                    <option value="บ้านญาติ">บ้านญาติ</option>
                                    <option value="บ้านพัก/บ้านเช่า">บ้านพัก / บ้านเช่า</option>
                                    <option value="อื่นๆ">อื่นๆ</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>สภาพภายในบ้าน</label>
                                <select id="v_house_condition" class="form-control">
                                    <option value="สะอาดมีระเบียบ">สะอาดมีระเบียบ</option>
                                    <option value="ไม่ค่อยสะอาดมีระเบียบ">ไม่ค่อยสะอาดมีระเบียบ</option>
                                    <option value="สกปรกไม่มีระเบียบ">สกปรกไม่มีระเบียบ</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-section-header" style="margin-top: 1.6rem;">
                            <i class="fa-solid fa-users" style="color: #0284c7;"></i> ข้อมูลสมาชิกครอบครัว & สถานภาพผู้ปกครอง
                        </div>
                        <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                            <div class="form-group">
                                <label>สมาชิกครอบครัวทั้งหมด (คน)</label>
                                <input type="number" id="v_family_members_count" class="form-control" value="4">
                            </div>
                            <div class="form-group">
                                <label>พี่น้องบิดามารดาเดียวกัน (คน)</label>
                                <input type="number" id="v_siblings_same_parents" class="form-control" value="1">
                            </div>
                            <div class="form-group">
                                <label>ความสัมพันธ์ในครอบครัว</label>
                                <select id="v_family_relation" class="form-control">
                                    <option value="รักใคร่กันดี">รักใคร่กันดี</option>
                                    <option value="ขัดแย้งทะเลาะกันบางครั้ง">ขัดแย้งทะเลาะกันบางครั้ง</option>
                                    <option value="ขัดแย้งทะเลาะกันบ่อยครั้ง">ขัดแย้งทะเลาะกันบ่อยครั้ง</option>
                                    <option value="ขัดแย้งและทำร้ายร่างกายบางครั้ง">ขัดแย้งและทำร้ายร่างกายบางครั้ง</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>สถานภาพบิดามารดา</label>
                                <select id="v_parent_status" class="form-control">
                                    <option value="อยู่ด้วยกัน">อยู่ด้วยกัน</option>
                                    <option value="หย่าร้าง">หย่าร้าง / แยกกันอยู่</option>
                                    <option value="บิดาเสียชีวิต">บิดาเสียชีวิต</option>
                                    <option value="มารดาเสียชีวิต">มารดาเสียชีวิต</option>
                                    <option value="บิดามารดาเสียชีวิต">บิดามารดาเสียชีวิต</option>
                                    <option value="บิดาสมรสใหม่">บิดาสมรสใหม่</option>
                                    <option value="มารดาสมรสใหม่">มารดาสมรสใหม่</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>ปัจจุบันนักเรียนอาศัยอยู่กับ</label>
                                <select id="v_living_with" class="form-control">
                                    <option value="บิดามารดา">บิดามารดา</option>
                                    <option value="บิดา">บิดา</option>
                                    <option value="มารดา">มารดา</option>
                                    <option value="ญาติ">ญาติ</option>
                                    <option value="ตามลำพัง">ตามลำพัง</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>การอบรมเลี้ยงดู</label>
                                <select id="v_upbringing" class="form-control">
                                    <option value="ใช้เหตุผล">ใช้เหตุผล</option>
                                    <option value="ตามใจ">ตามใจ</option>
                                    <option value="เข้มงวดกวดขัน">เข้มงวดกวดขัน</option>
                                    <option value="ปล่อยปละละเลย">ปล่อยปละละเลย</option>
                                </select>
                            </div>
                        </div>

                        <div style="text-align: right; margin-top: 1.6rem;">
                            <button type="button" class="btn-nav-next" onclick="goToStep(2)">
                                ถัดไป: รายได้ & การเดินทาง <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Income & Daily Routine -->
                <div class="step-content" id="step-2" style="display: none;">
                    <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:1.2rem;">
                        <div class="form-section-header">
                            <i class="fa-solid fa-coins" style="color: #0284c7;"></i> อาชีพ รายได้ และเศรษฐกิจครอบครัว
                        </div>
                        <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                            <div class="form-group">
                                <label>อาชีพหลักของผู้ปกครอง</label>
                                <select id="v_guardian_job" class="form-control">
                                    <option value="ค้าขาย">ค้าขาย / ธุรกิจส่วนตัว</option>
                                    <option value="รับจ้าง">รับจ้างทั่วไป</option>
                                    <option value="รับราชการ">รับราชการ / รัฐวิสาหกิจ</option>
                                    <option value="เกษตรกร">เกษตรกร</option>
                                    <option value="อื่นๆ">อื่นๆ</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>รายได้ครอบครัวต่อปี</label>
                                <select id="v_yearly_income" class="form-control">
                                    <option value="ไม่เกิน 40,000 บาท">ไม่เกิน 40,000 บาท</option>
                                    <option value="40,001 - 99,999 บาท" selected>40,001 - 99,999 บาท</option>
                                    <option value="100,000 บาทขึ้นไป">100,000 บาทขึ้นไป</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>รายได้เทียบกับรายจ่าย</label>
                                <select id="v_income_expense_balance" class="form-control">
                                    <option value="เพียงพอ">เพียงพอ</option>
                                    <option value="ไม่เพียงพอในบางครั้ง">ไม่เพียงพอในบางครั้ง</option>
                                    <option value="ขัดสน">ขัดสน</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-section-header" style="margin-top: 1.6rem;">
                            <i class="fa-solid fa-bus" style="color: #0284c7;"></i> การเดินทางมาโรงเรียน & เงินมาโรงเรียน
                        </div>
                        <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                            <div class="form-group">
                                <label>เดินทางมาโรงเรียนโดย</label>
                                <select id="v_commute_method" class="form-control">
                                    <option value="รถจักรยานยนต์">รถจักรยานยนต์</option>
                                    <option value="รถประจำทาง/รถรับส่ง">รถประจำทาง / รถรับส่งนักเรียน</option>
                                    <option value="เดิน">เดิน</option>
                                    <option value="รถจักรยาน">รถจักรยาน</option>
                                    <option value="อื่นๆ">อื่นๆ</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>ระยะทางจากบ้านถึงโรงเรียน (กม.)</label>
                                <input type="number" step="0.1" id="v_distance_km" class="form-control" value="3.5">
                            </div>
                            <div class="form-group">
                                <label>เวลาเดินทาง (นาที)</label>
                                <input type="number" id="v_travel_time_mins" class="form-control" value="15">
                            </div>
                            <div class="form-group">
                                <label>เงินมาโรงเรียนต่อวัน (บาท)</label>
                                <input type="number" id="v_daily_allowance" class="form-control" value="60">
                            </div>
                        </div>

                        <div class="form-section-header" style="margin-top: 1.6rem;">
                            <i class="fa-solid fa-clock" style="color: #0284c7;"></i> การดำเนินชีวิตประจำวัน & พฤติกรรมที่บ้าน
                        </div>
                        <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                            <div class="form-group">
                                <label>เวลา เข้านอน</label>
                                <select id="v_sleep_time" class="form-control">
                                    <option value="ก่อน 22.00 น.">ก่อน 22.00 น.</option>
                                    <option value="22.00 - 24.00 น.">22.00 - 24.00 น.</option>
                                    <option value="หลัง 24.00 น.">หลัง 24.00 น.</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>เวลา ตื่นนอน</label>
                                <select id="v_wake_time" class="form-control">
                                    <option value="ก่อน 05.00 น.">ก่อน 05.00 น.</option>
                                    <option value="05.00 - 06.00 น.">05.00 - 06.00 น.</option>
                                    <option value="หลัง 06.00 น.">หลัง 06.00 น.</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>การนอนค้างบ้านเพื่อน/คนอื่น</label>
                                <select id="v_stay_overnight_freq" class="form-control">
                                    <option value="ไม่เคย">ไม่เคย</option>
                                    <option value="ครั้งคราว">ครั้งคราว</option>
                                    <option value="บ่อยครั้ง">บ่อยครั้ง</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>การเล่นเกมมือถือ/คอมพิวเตอร์</label>
                                <select id="v_gaming_freq" class="form-control">
                                    <option value="ครั้งคราว">ครั้งคราว</option>
                                    <option value="บ่อยครั้ง">บ่อยครั้ง</option>
                                    <option value="ประจำ">ประจำ</option>
                                    <option value="ไม่เคย">ไม่เคย</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-top: 1.6rem; flex-wrap: wrap; gap: 10px;">
                            <button type="button" class="btn-nav-back" onclick="goToStep(1)">
                                <i class="fa-solid fa-arrow-left"></i> ย้อนกลับ
                            </button>
                            <button type="button" class="btn-nav-next" onclick="goToStep(3)">
                                ถัดไป: การเรียน & เพื่อน <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Step 3: Study & Behavior -->
                <div class="step-content" id="step-3" style="display: none;">
                    <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:1.2rem;">
                        <div class="form-section-header">
                            <i class="fa-solid fa-book-open-reader" style="color: #0284c7;"></i> การเรียน ทัศนคติ และความต้องการในอนาคต
                        </div>
                        <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                            <div class="form-group">
                                <label>การขยันอ่านหนังสือ / ทำการบ้าน</label>
                                <select id="v_study_at_home_freq" class="form-control">
                                    <option value="บ่อยครั้ง">บ่อยครั้ง</option>
                                    <option value="ครั้งคราว">ครั้งคราว</option>
                                    <option value="ประจำ">ประจำ</option>
                                    <option value="ไม่เคย">ไม่เคย</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>เป้าหมายผู้ปกครองเมื่อจบ ม.6</label>
                                <select id="v_parent_goal_m6" class="form-control">
                                    <option value="ศึกษาต่อระดับมหาวิทยาลัย/สูงกว่า">ศึกษาต่อระดับมหาวิทยาลัย / สูงกว่า</option>
                                    <option value="ประกอบอาชีพ">ประกอบอาชีพ</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>อาชีพที่นักเรียนใฝ่ฝันในอนาคต</label>
                                <input type="text" id="v_student_dream_job" class="form-control" placeholder="เช่น หมอ, วิศวกร, ครู, นักธุรกิจ">
                            </div>
                            <div class="form-group">
                                <label>การเข้ากับเพื่อนในโรงเรียน</label>
                                <select id="v_friendship_ease" class="form-control">
                                    <option value="ง่าย">เข้ากับเพื่อนได้ง่าย</option>
                                    <option value="ค่อนข้างง่าย">ค่อนข้างง่าย</option>
                                    <option value="ยาก">ยาก / เก็บตัว</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group" style="margin-top: 1.2rem;">
                            <label style="font-weight: 700; color: #0369a1;">ปัญหาทางการเรียนในปัจจุบัน (เลือกได้หลายข้อ)</label>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 8px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
                                <label style="cursor: pointer;"><input type="checkbox" name="v_study_problems" value="ไม่มีปัญหา"> 🟢 ไม่มีปัญหา</label>
                                <label style="cursor: pointer;"><input type="checkbox" name="v_study_problems" value="เรียนไม่เข้าใจ"> ⚠️ เรียนไม่เข้าใจ</label>
                                <label style="cursor: pointer;"><input type="checkbox" name="v_study_problems" value="เบื่อเรียนบางวิชา"> ⚠️ เบื่อเรียนบางวิชา</label>
                                <label style="cursor: pointer;"><input type="checkbox" name="v_study_problems" value="เรียนไม่ทันเพื่อน"> ⚠️ เรียนไม่ทันเพื่อน</label>
                                <label style="cursor: pointer;"><input type="checkbox" name="v_study_problems" value="ต้องการให้เพื่อนช่วย"> 🤝 ต้องการให้เพื่อนช่วย</label>
                                <label style="cursor: pointer;"><input type="checkbox" name="v_study_problems" value="ต้องการครูที่เข้าใจ"> 👨‍🏫 ต้องการครูที่เข้าใจ</label>
                            </div>
                        </div>

                        <div class="form-group" style="margin-top: 1.2rem;">
                            <label>เมื่อมีปัญหาเกิดขึ้น นักเรียนมักจะ</label>
                            <select id="v_problem_solving_way" class="form-control">
                                <option value="ปรึกษาบิดามารดา/ผู้ปกครอง">ปรึกษาบิดามารดา / ผู้ปกครอง</option>
                                <option value="ปรึกษาเพื่อน">ปรึกษาเพื่อน</option>
                                <option value="ปรึกษาครู">ปรึกษาครู</option>
                                <option value="แก้ปัญหาด้วยตนเอง">แก้ปัญหาด้วยตนเอง</option>
                                <option value="เก็บไว้คนเดียว">เก็บไว้คนเดียว</option>
                            </select>
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-top: 1.6rem; flex-wrap: wrap; gap: 10px;">
                            <button type="button" class="btn-nav-back" onclick="goToStep(2)">
                                <i class="fa-solid fa-arrow-left"></i> ย้อนกลับ
                            </button>
                            <button type="button" class="btn-nav-next" onclick="goToStep(4)">
                                ถัดไป: ประเมิน & ข้อเสนอแนะ <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Step 4: Assessment & Summary -->
                <div class="step-content" id="step-4" style="display: none;">
                    <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:1.2rem;">
                        <div class="form-section-header">
                            <i class="fa-solid fa-clipboard-check" style="color: #0284c7;"></i> การประเมินคุณลักษณะ & พฤติกรรมนักเรียนที่บ้าน (10 ด้าน)
                        </div>
                        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 12px;">
                            คลิกเลือกการประเมินตามสภาพความเป็นจริงเมื่อนักเรียนอยู่ที่บ้าน:
                        </p>

                        <div id="rating-items-container">
                            <!-- Dynamic Interactive Rating Rows -->
                        </div>

                        <div class="form-section-header" style="margin-top: 1.6rem;">
                            <i class="fa-solid fa-comment-dots" style="color: #0284c7;"></i> ข้อเสนอแนะ & ความช่วยเหลือจากโรงเรียน
                        </div>
                        <div class="form-group">
                            <label>สิ่งที่ผู้ปกครองต้องการให้โรงเรียนช่วยเหลือ / ส่งเสริม:</label>
                            <textarea id="v_parent_request_school" class="form-control" rows="2" placeholder="เช่น การกู้ยืมทุนการศึกษา, การกวดวิชาเพิ่มเติมนอกเวลา, สวัสดิการ"></textarea>
                        </div>
                        <div class="form-group">
                            <label>ข้อเสนอแนะเพิ่มเติมของผู้ปกครองที่มีต่อโรงเรียน:</label>
                            <textarea id="v_parent_comments" class="form-control" rows="2" placeholder="ความเห็นเกี่ยวกับสภาพแวดล้อม การเรียน หรือกิจกรรมของโรงเรียน"></textarea>
                        </div>

                        <div class="form-section-header" style="margin-top: 1.6rem;">
                            <i class="fa-solid fa-signature" style="color: #0284c7;"></i> สรุปภาพรวมและลงชื่อผู้ให้ข้อมูล
                        </div>
                        <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                            <div class="form-group">
                                <label>ชื่อ-นามสกุล ผู้ให้ข้อมูล <span style="color:#ef4444;">*</span></label>
                                <input type="text" id="v_informant_name" class="form-control" placeholder="ชื่อผู้ปกครอง / นักเรียน" required>
                            </div>
                            <div class="form-group">
                                <label>เกี่ยวข้องเป็น</label>
                                <input type="text" id="v_informant_relation" class="form-control" value="บิดา/มารดา">
                            </div>
                            <div class="form-group">
                                <label>เบอร์โทรศัพท์ผู้ปกครอง / ติดต่อ <span style="color:#ef4444;">*</span></label>
                                <input type="tel" id="v_informant_phone" class="form-control" placeholder="เช่น 081-234-5678" required>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.8rem; flex-wrap: wrap; gap: 10px;">
                            <button type="button" class="btn-nav-back" onclick="goToStep(3)">
                                <i class="fa-solid fa-arrow-left"></i> ย้อนกลับ
                            </button>
                            <button type="submit" class="btn btn-pink" style="padding: 12px 28px; font-size: 1rem; font-weight: 700; width:auto;">
                                <i class="fa-solid fa-cloud-arrow-up"></i> บันทึกข้อมูลการเยี่ยมบ้าน 💾
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    `;
}

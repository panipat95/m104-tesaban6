const fs = require('fs');
const https = require('https');

const POR_NONG_MAEWSOM_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "IreTHxq60X+lc2mZR1TdpTnEvYDhvqBAwc/YPWI8llBUETzGurjjqt5Am4zUC4wzKJdinCdl/Kfv8sxchKSDmrHrgirxWtKnKvCEzN01r0+qDfTGrVAoQnNyATuFxZGsLBwQ2C2KNN+2Nd19lwXOpwdB04t89/1O/w1cDnyilFU=";

function getThaiDateAndDay() {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const dayName = days[now.getDay()];
    
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const dateStr = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}`;
    
    return { dayName, dateStr };
}

function loadStudentData() {
    const fileContent = fs.readFileSync('real_db.js', 'utf8');
    const jsonStart = fileContent.indexOf('[');
    const jsonEnd = fileContent.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = fileContent.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonStr);
    }
    return [];
}

async function sendLineBroadcast(messageText) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            messages: [
                {
                    type: "text",
                    text: messageText
                }
            ]
        });

        const options = {
            hostname: 'api.line.me',
            path: '/v2/bot/message/broadcast',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${POR_NONG_MAEWSOM_TOKEN}`,
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ LINE Broadcast sent successfully! Status:', res.statusCode);
                    resolve(responseBody);
                } else {
                    console.error('❌ LINE Broadcast failed! Status:', res.statusCode, responseBody);
                    reject(new Error(`HTTP ${res.statusCode}: ${responseBody}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

async function main() {
    const { dayName, dateStr } = getThaiDateAndDay();
    console.log(`📅 Today is: ${dayName} (${dateStr})`);

    if (dayName === 'เสาร์' || dayName === 'อาทิตย์') {
        console.log('😴 Today is a weekend. Skipping automated daily duty reminder.');
        return;
    }

    const students = loadStudentData();
    const dutyStudents = students.filter(s => s.duty_day === dayName);

    let msg = `🧹 [แจ้งเตือนเวรทำความสะอาดประจำวัน ม.1/4 SMT]\n`;
    msg += `📅 ประจำวัน${dayName} (${dateStr})\n\n`;
    msg += `⏰ เวลาปฏิบัติหน้าที่: 07.30 - 07.40 น.\n`;
    msg += `📍 ภารกิจ: ทำเขตจิตอาสาถูพื้นศูนย์จีน & ทำความสะอาดห้องเรียน 332\n\n`;
    msg += `👥 รายชื่อนักเรียนเวรประจำวัน${dayName} (${dutyStudents.length} คน):\n`;

    if (dutyStudents.length > 0) {
        dutyStudents.forEach((s, idx) => {
            msg += `${idx + 1}. เลขที่ ${s.no} ${s.fullname} ${s.nickname ? `(${s.nickname})` : ''}\n`;
        });
    } else {
        msg += `(ไม่มีรายชื่อเวรทำความสะอาด)\n`;
    }

    msg += `\n✨ ขอให้นักเรียนที่มีรายชื่อมาร่วมทำความสะอาดและถูพื้นตรงตามเวลาด้วยนะครับ/ค่ะ 🙏`;

    console.log('--- Message Preview ---');
    console.log(msg);
    console.log('-----------------------');

    await sendLineBroadcast(msg);
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});

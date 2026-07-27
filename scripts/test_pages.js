const fs = require('fs');
const path = require('path');

const pages = ['index.html', 'parent.html', 'leader.html', 'visit.html'];
const rootDir = 'd:\\porsky';

pages.forEach(page => {
    const filePath = path.join(rootDir, page);
    if (!fs.existsSync(filePath)) {
        console.error(`MISSING FILE: ${page}`);
        return;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`Checking ${page} (${content.length} bytes)...`);

    // Extract script src tags specifically
    const scriptSrcMatches = content.match(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];

    scriptSrcMatches.forEach(tag => {
        const match = tag.match(/src=["']([^"']+)["']/i);
        if (match && match[1]) {
            const src = match[1];
            if (!src.startsWith('http') && !src.startsWith('//')) {
                const jsPath = path.join(rootDir, src);
                if (!fs.existsSync(jsPath)) {
                    console.error(`  ❌ BROKEN SCRIPT LINK in ${page}: ${src}`);
                } else {
                    console.log(`  ✅ Verified script link: ${src}`);
                }
            }
        }
    });
});

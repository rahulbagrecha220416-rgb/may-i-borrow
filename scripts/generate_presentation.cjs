
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Image Paths (Correcting slashes for Windows)
const IMG_TITLE = "C:/Users/rahul/.gemini/antigravity/brain/f98580b2-04df-4466-af39-2839d513bfc8/may_i_borrow_title_concept_1767882860147.png";
const IMG_DASHBOARD = "C:/Users/rahul/.gemini/antigravity/brain/f98580b2-04df-4466-af39-2839d513bfc8/may_i_borrow_dashboard_1767882887347.png";
const IMG_USAGE = "C:/Users/rahul/.gemini/antigravity/brain/f98580b2-04df-4466-af39-2839d513bfc8/may_i_borrow_usage_1767882916603.png";
const IMG_TRUST = "C:/Users/rahul/.gemini/antigravity/brain/f98580b2-04df-4466-af39-2839d513bfc8/may_i_borrow_trust_1767882945357.png";

// Output Path
const OUTPUT_PATH = "C:/test antigravity/may-i-borrow/May_I_Borrow_Presentation.pdf";

const doc = new PDFDocument({ layout: 'landscape', margin: 50 });
doc.pipe(fs.createWriteStream(OUTPUT_PATH));

// --- SLIDE 1: TITLE ---
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#10B981'); // Emerald Background
doc.fillColor('white');
doc.fontSize(48).text('May I Borrow?', 50, 150, { align: 'center' });
doc.fontSize(24).text('The "Favor, Not Service" Community App', 50, 220, { align: 'center' });

// Add Title Image (Centered)
try {
    doc.image(IMG_TITLE, (doc.page.width - 400) / 2, 300, { width: 400 });
} catch (e) { console.log("Error loading title image"); }

// --- SLIDE 2: USE CASES ---
doc.addPage();
doc.rect(0, 0, doc.page.width, 100).fill('#ECFDF5'); // Header bg
doc.fillColor('#065F46').fontSize(32).text('Use Cases', 50, 40);

doc.fillColor('#333333').fontSize(20).text('1. Apartment Communities', 50, 150);
doc.fontSize(14).text('Neighbors sharing drills, ladders, and party chairs. Why buy when you can borrow?', 50, 180, { width: 300 });

doc.fontSize(20).text('2. Hobby Clubs', 50, 250);
doc.fontSize(14).text('Book clubs exchanging reads, cycling groups sharing gear, or board game nights.', 50, 280, { width: 300 });

doc.fontSize(20).text('3. Office Spaces', 50, 350);
doc.fontSize(14).text('Colleagues sharing chargers, adapters, or specialized tools.', 50, 380, { width: 300 });

// Add Dashboard Image on Right
try {
    doc.image(IMG_DASHBOARD, 400, 150, { width: 300 });
} catch (e) { }

// --- SLIDE 3: HOW IT WORKS ---
doc.addPage();
doc.rect(0, 0, doc.page.width, 100).fill('#ECFDF5');
doc.fillColor('#065F46').fontSize(32).text('How It Works: Tribes', 50, 40);

doc.fillColor('#333333').fontSize(16).text('Lending happens in "Tribes" (Groups), not random feeds. Trust is built within circles you already know.', 50, 120, { width: 700 });

doc.text('Step 1: Join a Tribe (e.g., "Tower A Residents").', 50, 180);
doc.text('Step 2: Post an Item (or Request one).', 50, 210);
doc.text('Step 3: Approval is based on Trust Scores.', 50, 240);

// Add Usage Image Center Bottom
try {
    doc.image(IMG_USAGE, (doc.page.width - 250) / 2, 300, { width: 250 });
} catch (e) { }

// --- SLIDE 4: TRUST & SAFETY ---
doc.addPage();
doc.rect(0, 0, doc.page.width, 100).fill('#ECFDF5');
doc.fillColor('#065F46').fontSize(32).text('Trust & Karma', 50, 40);

doc.fillColor('#333333').fontSize(16).text('The core of "May I Borrow" is reputation.', 50, 120);

doc.list([
    'Trust Score: Based on successful returns and verification.',
    'Karma Points: Earned by lending. Spend them to borrow premium items.',
    'Community Pledge: Every user signs a pledge to respect items.',
], 50, 160, { width: 400, bulletRadius: 3 });

// Add Trust Image
try {
    doc.image(IMG_TRUST, 500, 150, { width: 250 });
} catch (e) { }


// --- SLIDE 5: GET STARTED ---
doc.addPage();
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#064E3B'); // Dark Green Background
doc.fillColor('white');
doc.fontSize(40).text('Ready to Start?', 50, 200, { align: 'center' });
doc.fontSize(20).text('Download the App & Join Your First Tribe Today.', 50, 280, { align: 'center' });
doc.fontSize(14).text('May I Borrow? Yes, you may.', 50, 350, { align: 'center' });


doc.end();
console.log("PDF Created Successfully at " + OUTPUT_PATH);

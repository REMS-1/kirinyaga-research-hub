const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

function updateFile(filename, updates) {
    const filePath = path.join(publicDir, filename);
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    updates.forEach(update => {
        content = content.replace(update.find, update.replace);
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filename}`);
}

// 1. Update index.html
updateFile('index.html', [
    {
        find: /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Material\+Symbols\+Outlined:wght,FILL@100\.\.700,0\.\.1&amp;display=swap" rel="stylesheet"\/>\s+<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Material\+Symbols+Outlined:wght,FILL@100\.\.700,0\.\.1&amp;display=swap" rel="stylesheet"\/>\s+<link rel="stylesheet" href="css\/ai-guide\.css">\s+<link rel="stylesheet" href="css\/ai-guide\.css">/g,
        replace: `<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>\n<link rel="stylesheet" href="css/index.css">\n<link rel="stylesheet" href="css/ai-guide.css">`
    },
    {
        find: /colors: \{/g,
        replace: `colors: {\n              "cream-yellow": "#FFFBEB",\n              "emerald-scholar": "#022C22",`
    },
    {
        find: /bg-zinc-950 overflow-hidden text-emerald-50/g,
        replace: `bg-emerald-scholar overflow-hidden text-emerald-50`
    },
    {
        find: /bg-surface text-emerald-50/g,
        replace: `bg-emerald-scholar text-emerald-50`
    }
]);

// 2. Update students.html (JS Link)
updateFile('students.html', [
    {
        find: /<\/script>\n<\/body><\/html>/g,
        replace: `</script>\n<script src="js/ai-guide.js"></script>\n</body></html>`
    }
]);

// 3. Update funding.html
const footerHtml = `    <!-- Premium Institutional Footer -->
    <footer class="bg-zinc-950 w-full py-20 px-8 border-t border-white/10 overflow-hidden relative mt-16">
        <div class="absolute inset-0 opacity-5 pointer-events-none" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
        <div class="max-w-7xl mx-auto relative z-10">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <div class="md:col-span-2 space-y-6 text-left">
                    <div class="text-2xl font-bold text-white tracking-tighter font-headline">Kirinyaga Research Hub</div>
                    <p class="text-zinc-400 text-sm leading-relaxed max-w-sm font-body">Empowering the next generation of Kirinyaga researchers through peer-reviewed excellence and global industry connectivity.</p>
                </div>
                <div class="space-y-6 text-left">
                    <h4 class="text-amber-500 font-bold uppercase tracking-widest text-xs">Scholarly Resources</h4>
                    <ul class="space-y-4">
                        <li><a href="#" class="text-zinc-400 hover:text-white transition-colors text-sm font-body">Grant Writing Hub</a></li>
                        <li><a href="#" class="text-zinc-400 hover:text-white transition-colors text-sm font-body">Ethics Committee</a></li>
                    </ul>
                </div>
                <div class="space-y-6 text-left">
                    <h4 class="text-amber-500 font-bold uppercase tracking-widest text-xs">Connectivity</h4>
                    <ul class="space-y-4">
                        <li><a href="#" class="text-zinc-400 hover:text-white transition-colors text-sm font-body">Privacy Protocol</a></li>
                        <li><a href="#" class="text-zinc-400 hover:text-white transition-colors text-sm font-body">Terms of Research</a></li>
                    </ul>
                </div>
            </div>
            <div class="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <p class="text-zinc-500 text-xs text-left">© 2024 Kirinyaga Research Hub. Scholarly Digital Atelier.</p>
            </div>
        </div>
    </footer>
    <script src="js/ai-guide.js"></script>\n</body>\n</html>`;

updateFile('funding.html', [
    {
        find: /<\/head>/g,
        replace: `<link rel="stylesheet" href="css/index.css">\n<link rel="stylesheet" href="css/ai-guide.css">\n</head>`
    },
    {
        find: /colors: \{/g,
        replace: `colors: {\n              "cream-yellow": "#FFFBEB",\n              "emerald-scholar": "#022C22",`
    },
    {
        find: /<\/body>\s+<\/html>/g,
        replace: footerHtml
    }
]);

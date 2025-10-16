const C = 13,
    R = 8;
const matrixEl = document.getElementById('matrix'),
    binaryEl = document.getElementById('binary'),
    wordsEl = document.getElementById('words'),
    wordCountEl = document.getElementById('wordCount');
const cells = [];
for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
        const btn = document.createElement('button');
        btn.className = 'cell';
        btn.dataset.r = r;
        btn.dataset.c = c;
        btn.addEventListener('click', () => {
            btn.classList.toggle('on');
            update();
        });
        matrixEl.appendChild(btn);
        cells.push(btn);
    }
}

function getBitArray() {
    const bits = [];
    for (let r = 0; r < R; r++)
        for (let c = 0; c < C; c++) bits.push(cells[r * C + c].classList.contains('on') ? '1' : '0');
    return bits;
}

function chunkAndFormat(bits) {
    const words = [],
        chunkBits = 32;
    for (let i = 0; i < 4; i++) {
        const chunk = bits.slice(i * chunkBits, (i + 1) * chunkBits);
        const padded = chunk.concat(Array(chunkBits - chunk.length).fill('0'));
        const val = parseInt(padded.join(''), 2) >>> 0;
        words.push({
            bits: padded.join(''),
            value: val
        });
    }
    return words;
}

function update() {
    const bits = getBitArray();
    binaryEl.textContent = bits.join('').match(/.{1,8}/g)?.join(' ') ?? '';
    const words = chunkAndFormat(bits);
    wordsEl.innerHTML = '';
    words.forEach((w, i) => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.textContent = `#${i}: ${w.value} (0x${w.value.toString(16).padStart(8,'0')})`;
        wordsEl.appendChild(chip);
    });
    wordCountEl.textContent = words.length;
}

function shiftLeft(wrap = true) {
    for (let r = 0; r < R; r++) {
        const row = cells.slice(r * C, r * C + C);
        const first = row[0].classList.contains('on');
        for (let c = 0; c < C - 1; c++) row[c].classList.toggle('on', row[c + 1].classList.contains('on'));
        row[C - 1].classList.toggle('on', wrap ? first : false);
    }
    update();
}

function shiftRight(wrap = true) {
    for (let r = 0; r < R; r++) {
        const row = cells.slice(r * C, r * C + C);
        const last = row[C - 1].classList.contains('on');
        for (let c = C - 1; c > 0; c--) row[c].classList.toggle('on', row[c - 1].classList.contains('on'));
        row[0].classList.toggle('on', wrap ? last : false);
    }
    update();
}

const storyboard = [];
let playInterval = null;

function getMatrixState() {
    return cells.map(b => b.classList.contains('on') ? '1' : '0').join('');
}

function setMatrixState(state) {
    state.split('').forEach((bit, i) => cells[i].classList.toggle('on', bit === '1'));
    update();
}

function renderStoryboard() {
    const list = document.getElementById('framesList');
    list.innerHTML = '';
    storyboard.forEach((frame, i) => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.style.display = 'flex';
        chip.style.flexDirection = 'column';
        chip.style.alignItems = 'center';
        chip.style.padding = '6px';
        const label = document.createElement('div');
        label.textContent = `#${i+1}`;
        label.style.marginBottom = '4px';
        chip.appendChild(label);
        const preview = document.createElement('div');
        preview.style.display = 'grid';
        preview.style.gridTemplateColumns = `repeat(${C},6px)`;
        preview.style.gridAutoRows = '6px';
        preview.style.gap = '1px';
        frame.split('').forEach(bit => {
            const dot = document.createElement('div');
            dot.style.width = '6px';
            dot.style.height = '6px';
            dot.style.borderRadius = '2px';
            dot.style.background = bit === '1' ? 'var(--accent)' : '#1e293b';
            preview.appendChild(dot);
        });
        chip.appendChild(preview);
        chip.addEventListener('click', () => setMatrixState(frame));
        list.appendChild(chip);
    });
}

document.getElementById('saveFrame').addEventListener('click', () => {
    storyboard.push(getMatrixState());
    renderStoryboard();
});
document.getElementById('copyFrame').addEventListener('click', () => {
    const f = getMatrixState();
    navigator.clipboard.writeText(f).then(() => alert('Frame copied:\n' + f));
});
document.getElementById('pasteFrame').addEventListener('click', async () => {
    try {
        const t = await navigator.clipboard.readText();
        const clean = t.replace(/[^01]/g, '');
        if (clean.length === R * C) {
            setMatrixState(clean);
            alert('Frame pasted');
        } else alert('Invalid frame');
    } catch (e) {
        alert('Clipboard read failed:' + e);
    }
});
document.getElementById('exportFrame').addEventListener('click', () => {
    const bits = getBitArray();
    const chunkBits = 32;
    const words = [];
    for (let i = 0; i < 4; i++) {
        const chunk = bits.slice(i * chunkBits, (i + 1) * chunkBits);
        const padded = chunk.concat(Array(chunkBits - chunk.length).fill('0'));
        const val = parseInt(padded.join(''), 2) >>> 0;
        words.push('0x' + val.toString(16).padStart(8, '0'));
    }
    const res = words.join(',');
    navigator.clipboard.writeText(res).then(() => alert('Exported frame:\n' + res));
});
document.getElementById('clearStoryboard').addEventListener('click', () => {
    storyboard.length = 0;
    renderStoryboard();
});
document.getElementById('playStoryboard').addEventListener('click', () => {
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
        document.getElementById('playStoryboard').textContent = 'Play';
    } else if (storyboard.length > 0) {
        let idx = 0;
        playInterval = setInterval(() => {
            setMatrixState(storyboard[idx]);
            idx = (idx + 1) % storyboard.length;
        }, 400);
        document.getElementById('playStoryboard').textContent = 'Stop';
    }
});
document.getElementById('clear').addEventListener('click', () => {
    cells.forEach(b => b.classList.remove('on'));
    update();
});
document.getElementById('randomize').addEventListener('click', () => {
    cells.forEach(b => Math.random() > .5 ? b.classList.add('on') : b.classList.remove('on'));
    update();
});
document.getElementById('invert').addEventListener('click', () => {
    cells.forEach(b => b.classList.toggle('on'));
    update();
});
document.getElementById('shiftLeft').addEventListener('click', () => shiftLeft());
document.getElementById('shiftRight').addEventListener('click', () => shiftRight());
document.getElementById('animate').addEventListener('click', () => {
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
        document.getElementById('animate').textContent = 'Animate';
    } else {
        playInterval = setInterval(() => shiftLeft(), 200);
        document.getElementById('animate').textContent = 'Stop';
    }
});
update();
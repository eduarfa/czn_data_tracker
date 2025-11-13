// /czn_data_tracker/script.js

/** CZN Data Tracker BETA**/

const allCharacters = [
  { name: "Yuki S2", color: "#ff79c6" }, { name: "Rei", color: "#8be9fd" }, { name: "Haru", color: "#ff6b6b" },
  { name: "Amir", color: "#50fa7b" }, { name: "Kayron", color: "#ffb86c" }, { name: "Khalipe", color: "#bd93f9" },
  { name: "Mika", color: "#f1fa8c" }, { name: "Mei Lin", color: "#ff5555" }, { name: "Chizuru", color: "#6272a4" },
  { name: "Sereniel", color: "#8be9fd" }, { name: "Rin", color: "#ffb86c" }, { name: "Magna", color: "#bd93f9" },
  { name: "Tressa", color: "#f1fa8c" }, { name: "Hugo", color: "#ff5555" }, { name: "Veronica", color: "#6272a4" },
  { name: "Reona", color: "#8be9fd" }, { name: "Nia", color: "#ff79c6" }, { name: "Cassius", color: "#50fa7b" },
  { name: "Selena", color: "#ffb86c" }, { name: "Lucas", color: "#bd93f9" }, { name: "Luke", color: "#f1fa8c" },
  { name: "Maribell", color: "#ff5555" }, { name: "Owen", color: "#6272a4" }, { name: "Orlea", color: "#ff6b6b" },
  { name: "Beryl", color: "#8be9fd" }
];

let data = JSON.parse(localStorage.getItem('czn-fmv-data-v5')) || {
  tier: 1,
  nightmare: false,
  chars: Array(3).fill().map((_, i) => ({
    charIndex: i % allCharacters.length,
    actions: {
      neutral: 0, epiNeutral: 0, forbidden: 0, monster: 0,
      removalBase: 0, removalOther: 0, copyNormal: 0,
      copyDivine: 0, divineBase: 0, divineNeutral: 0, conversion: 0
    }
  }))
};

const save = () => localStorage.setItem('czn-fmv-data-v5', JSON.stringify(data));

const scaleCost = count => {
  const costs = [0, 0, 10, 30, 50, 70];
  return count > 0 ? costs[Math.min(count, costs.length - 1)] : 0;
};

function calcTotalCost(a) {
  let total = 0;
  total += (a.neutral - a.epiNeutral - a.divineNeutral) * 20;
  total += a.epiNeutral * 30;
  total += a.divineNeutral * 40;
  total += a.forbidden * 20;
  total += a.monster * 80;
  total += scaleCost(a.removalBase + a.removalOther);
  total += a.removalBase * 20;
  total += scaleCost(a.copyNormal + a.copyDivine);
  total += a.copyDivine * 20;
  total += a.divineBase * 20;
  total += a.conversion * 10;
  return total;
}

const getFMV = () => {
  const tier = parseInt(document.getElementById('tier').value) || 1;
  const nightmare = document.getElementById('nightmare').checked;
  return 20 + tier * 10 + (nightmare ? 10 : 0);
};

function updateChar(i) {
  const c = data.chars[i];
  const total = calcTotalCost(c.actions);
  const fmv = getFMV();
  const percent = total / fmv;
  let status = 'safe', text = 'SAFE';
  if (percent > 1) { status = 'danger'; text = 'OVER CAP!'; }
  else if (percent > 0.9) { status = 'warning'; text = 'NEARLY!'; }

  const char = allCharacters[c.charIndex];
  document.querySelector(`#name-${i}`).textContent = char.name;
  document.querySelector(`#name-${i}`).style.color = char.color;
  document.getElementById(`status-${i}`).innerHTML =
    `<span class="${status}">FMV: ${total}/${fmv} (${text})</span>`;
}

function addAction(i, action, delta) {
  const c = data.chars[i].actions;
  c[action] = Math.max(0, c[action] + delta);
  save();
  render();
}

const canRemoveNonBase = a => a.neutral + a.forbidden + a.monster + a.conversion > 0;
const canAddNeutralEpi = a => a.neutral > a.epiNeutral + a.divineNeutral;
const canAddDivineNeutral = a => a.neutral > a.epiNeutral + a.divineNeutral;

function render() {
  const tierEl = document.getElementById('tier');
  const nmEl = document.getElementById('nightmare');
  tierEl.value = data.tier;
  nmEl.checked = data.nightmare;

  const container = document.getElementById('chars');
  container.innerHTML = '';
  data.chars.forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'char-card';
    div.innerHTML = generateCharHTML(c, i);
    container.appendChild(div);
    updateChar(i);
  });
}

function generateCharHTML(c, i) {
  const opts = allCharacters.map(
    (ch, idx) => `<option value="${idx}" ${c.charIndex === idx ? 'selected' : ''}>${ch.name}</option>`
  ).join('');

  const btn = (i, a, label, canAdd = true, canRemove = true, disableAdd = '') =>
    `<div class="action"><label>${label} (${c.actions[a]})</label>
      <div class="button-group">
        <button ${c.actions[a] <= 0 || !canRemove ? 'disabled' : ''} onclick="addAction(${i}, '${a}', -1)">-1</button>
        <button ${disableAdd} ${!canAdd ? 'disabled' : ''} onclick="addAction(${i}, '${a}', 1)">+1</button>
      </div></div>`;

  return `
    <div class="char-header">
      <div id="name-${i}" class="char-name"></div>
      <div id="status-${i}" class="fmv-status"></div>
    </div>
    <div class="char-select">
      <label>Character:</label>
      <select onchange="data.chars[${i}].charIndex=Number(this.value); save(); updateChar(${i})">${opts}</select>
    </div>
    <div class="actions">
      ${btn(i, 'neutral', 'Add Neutral Card')}
      ${btn(i, 'forbidden', 'Add Forbidden Card')}
      ${btn(i, 'monster', 'Add Monster Card', true, true, c.actions.monster >= 1 ? 'disabled' : '')}
      ${btn(i, 'removalBase', 'Remove Base Card')}
      ${btn(i, 'removalOther', 'Remove Other Card', canRemoveNonBase(c.actions))}
      ${btn(i, 'conversion', 'Conversion')}
      ${btn(i, 'epiNeutral', 'Normal Epi on Neutral', canAddNeutralEpi(c.actions))}
      ${btn(i, 'divineBase', 'Divine Epi on Base')}
      ${btn(i, 'divineNeutral', 'Divine Epi on Neutral', canAddDivineNeutral(c.actions))}
      ${btn(i, 'copyNormal', 'Copy Base/Normal')}
      ${btn(i, 'copyDivine', 'Copy Divine Epi')}
    </div>`;
}

function resetAll() {
  if (confirm("Reset ALL data?")) {
    data.chars.forEach((c, i) => {
      c.charIndex = i % allCharacters.length;
      c.actions = {
        neutral:0, epiNeutral:0, forbidden:0, monster:0,
        removalBase:0, removalOther:0, copyNormal:0,
        copyDivine:0, divineBase:0, divineNeutral:0, conversion:0
      };
    });
    save();
    render();
  }
}

function exportBuild() {
  const fmv = getFMV();
  const build = data.chars.map(c => {
    const char = allCharacters[c.charIndex].name;
    const a = c.actions;
    return `${char}: N${a.neutral} EN${a.epiNeutral} F${a.forbidden} M${a.monster} RB${a.removalBase} RO${a.removalOther} CN${a.copyNormal} CD${a.copyDivine} DB${a.divineBase} DN${a.divineNeutral} Conv${a.conversion} | ${calcTotalCost(a)}/${fmv}`;
  }).join('\n');

  navigator.clipboard.writeText(`CZN FMV Tracker v5.1\nTier ${data.tier} ${data.nightmare?'NM':''} | FMV:${fmv}\n\n${build}`);
  alert('Build copied to clipboard!');
}

document.getElementById('tier').addEventListener('change', () => {
  data.tier = Number(document.getElementById('tier').value);
  save(); data.chars.forEach((_, i) => updateChar(i));
});

document.getElementById('nightmare').addEventListener('change', () => {
  data.nightmare = document.getElementById('nightmare').checked;
  save(); data.chars.forEach((_, i) => updateChar(i));
});

document.getElementById('resetAll').addEventListener('click', resetAll);
document.getElementById('exportBuild').addEventListener('click', exportBuild);

render();

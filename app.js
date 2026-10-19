const STORAGE_KEY = "family-safety-card-v1";
const defaultPlan = {
  contacts: Array.from({ length: 3 }, () => ({ name: "", relation: "", phone: "" })),
  verify: ["回撥原本儲存的電話", "先向 165 反詐騙專線查詢"],
  safeWord: "",
  firstStep: "先掛斷或停止回覆，不按連結、不操作轉帳。",
};

const scenarios = [
  {
    title: "家人忽然傳訊借錢",
    situation: "通訊軟體裡熟悉的名字傳來訊息，說手機壞了、急著匯款，還交代你不要告訴其他家人。",
    options: [
      "照著帳號先匯款，晚點再問其他人。",
      "停止對話，打通訊錄裡原本存好的電話或當面確認。",
      "請對方傳一組簡訊驗證碼證明身份。",
    ],
    answer: 1,
    feedback: "正確做法是改用原本已知的聯絡方式獨立確認；不要回撥對方剛傳來的新號碼，也不要索取或提供驗證碼。",
  },
  {
    title: "客服要求操作網銀",
    situation: "陌生來電自稱平台客服，說帳戶設定錯誤，要求你開啟網路銀行、分享螢幕或依指示操作 ATM。",
    options: [
      "先停止通話，不操作交易；自行打開官方 App 或卡片上的客服資訊查詢。",
      "分享螢幕讓客服看著操作，比較不會按錯。",
      "輸入驗證碼取消錯誤設定。",
    ],
    answer: 0,
    feedback: "正確。掛斷後自行尋找官方客服管道，不按來電者傳的連結，不分享螢幕或輸入驗證碼。",
  },
  {
    title: "投資群組保證獲利",
    situation: "群組裡有人保證短期高報酬，要求你私下下載 App、先小額匯款，並提醒不要告訴家人。",
    options: [
      "先匯小額測試，賺到再加碼。",
      "把帳戶資料傳給群組管理員，請他先驗證資格。",
      "暫停匯款與下載，改從官方公開資訊查證，並找可信任的人討論。",
    ],
    answer: 2,
    feedback: "正確。先不匯款、不安裝陌生 App，也不要提供帳密；透過官方來源查證，必要時向當地反詐或警方諮詢。",
  },
];

let plan = loadPlan();
let toastTimer;

function loadPlan() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored || typeof stored !== "object") return structuredClone(defaultPlan);
    return {
      contacts: Array.from({ length: 3 }, (_, index) => ({
        ...defaultPlan.contacts[index],
        ...(stored.contacts?.[index] ?? {}),
      })),
      verify: Array.isArray(stored.verify) ? stored.verify : [...defaultPlan.verify],
      safeWord: typeof stored.safeWord === "string" ? stored.safeWord : "",
      firstStep: typeof stored.firstStep === "string" ? stored.firstStep : defaultPlan.firstStep,
    };
  } catch {
    return structuredClone(defaultPlan);
  }
}

function savePlan(showToast = false) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    const status = document.querySelector("#save-status");
    if (status) status.textContent = `已儲存至此裝置 · ${new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
    updateCard();
    updateDashboard();
    if (showToast) toast("已儲存到這台裝置");
  } catch {
    toast("瀏覽器未能儲存，請檢查裝置空間或隱私設定");
  }
}

function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2400);
}

function showView(name) {
  document.querySelectorAll("[data-view]").forEach((view) => {
    view.hidden = view.dataset.view !== name;
  });
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.nav === name);
  });
  if (name === "card") updateCard();
  if (name === "plan") renderContacts();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderContacts() {
  const list = document.querySelector("#contacts");
  list.replaceChildren();
  plan.contacts.forEach((contact, index) => {
    const row = document.createElement("div");
    row.className = "contact-row";
    const fields = [
      { key: "name", label: `聯絡人 ${index + 1} · 稱呼`, placeholder: "例如：阿姨", type: "text" },
      { key: "relation", label: "關係", placeholder: "例如：家人", type: "text" },
      { key: "phone", label: "電話（選填）", placeholder: "建議只填已存通訊錄的號碼", type: "tel" },
    ];
    fields.forEach((field) => {
      const label = document.createElement("label");
      const caption = document.createElement("span");
      caption.textContent = field.label;
      const input = document.createElement("input");
      input.type = field.type;
      input.maxLength = field.key === "phone" ? 30 : 40;
      input.placeholder = field.placeholder;
      input.value = contact[field.key] ?? "";
      input.autocomplete = "off";
      input.dataset.contactIndex = String(index);
      input.dataset.contactKey = field.key;
      input.setAttribute("aria-label", field.label);
      input.addEventListener("input", () => {
        plan.contacts[index][field.key] = input.value;
        savePlan();
      });
      label.append(caption, input);
      row.append(label);
    });
    list.append(row);
  });
}

function renderScenarios() {
  const list = document.querySelector("#practice-list");
  scenarios.forEach((scenario, index) => {
    const card = document.createElement("article");
    card.className = "practice-card";
    const top = document.createElement("div");
    top.className = "practice-top";
    const count = document.createElement("span");
    count.className = "practice-index";
    count.textContent = `情境 0${index + 1}`;
    top.append(count);
    const title = document.createElement("h2");
    title.textContent = scenario.title;
    const question = document.createElement("p");
    question.textContent = scenario.situation;
    const choices = document.createElement("div");
    choices.className = "choice-list";
    const feedback = document.createElement("p");
    feedback.className = "practice-feedback";
    feedback.setAttribute("aria-live", "polite");
    scenario.options.forEach((option, optionIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.textContent = option;
      button.addEventListener("click", () => {
        choices.querySelectorAll("button").forEach((choice, currentIndex) => {
          choice.disabled = true;
          if (currentIndex === scenario.answer) choice.classList.add("is-correct");
          else if (currentIndex === optionIndex) choice.classList.add("is-wrong");
        });
        feedback.textContent = optionIndex === scenario.answer
          ? scenario.feedback
          : `再想一想：${scenario.feedback}`;
        feedback.classList.toggle("is-wrong", optionIndex !== scenario.answer);
      });
      choices.append(button);
    });
    card.append(top, title, question, choices, feedback);
    list.append(card);
  });
}

function appendListItem(list, text, emptyLabel) {
  const item = document.createElement("li");
  const marker = document.createElement("span");
  marker.className = "list-mark";
  marker.textContent = text ? "✓" : "·";
  const label = document.createElement("span");
  label.textContent = text || emptyLabel;
  if (!text) item.className = "empty-item";
  item.append(marker, label);
  list.append(item);
}

function updateCard() {
  document.querySelector("#plan-first-step").textContent = plan.firstStep || defaultPlan.firstStep;
  const contacts = document.querySelector("#plan-contact-list");
  contacts.replaceChildren();
  const activeContacts = plan.contacts.filter((contact) => contact.name.trim());
  if (!activeContacts.length) appendListItem(contacts, "", "尚未設定聯絡人");
  activeContacts.forEach((contact) => {
    const label = [contact.name.trim(), contact.relation.trim(), contact.phone.trim()].filter(Boolean).join(" · ");
    appendListItem(contacts, label, "");
  });
  const verification = document.querySelector("#plan-verification-list");
  verification.replaceChildren();
  if (!plan.verify.length) appendListItem(verification, "", "尚未選擇查證方式");
  plan.verify.forEach((method) => appendListItem(verification, method, ""));
  document.querySelector("#safe-word-wrap").hidden = !plan.safeWord.trim();
  document.querySelector("#plan-safe-word").textContent = plan.safeWord.trim();
}

function updateDashboard() {
  const total = plan.contacts.filter((contact) => contact.name.trim()).length;
  const privacy = document.querySelector(".privacy-chip");
  if (privacy) privacy.title = `${total} 位可信任聯絡人已設定；資料存在本機瀏覽器`;
}

function setFormFromPlan() {
  document.querySelectorAll('input[name="verify"]').forEach((input) => {
    input.checked = plan.verify.includes(input.value);
  });
  document.querySelector("#safe-word").value = plan.safeWord;
  document.querySelector("#first-step").value = plan.firstStep;
  const status = document.querySelector("#save-status");
  if (status) status.textContent = localStorage.getItem(STORAGE_KEY) ? "已儲存在本機瀏覽器" : "只儲存在本機瀏覽器";
}

function downloadBackup() {
  const payload = {
    app: "家安小卡",
    exportedAt: new Date().toISOString(),
    note: "此備份包含你自行填寫的聯絡方式與家庭暗號，請妥善保存。",
    plan,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "家安小卡-本機備份.json";
  link.click();
  URL.revokeObjectURL(link.href);
  toast("備份已下載，請妥善保管");
}

async function copyReminder() {
  const person = plan.contacts.find((contact) => contact.name.trim());
  const personText = person ? `我先掛斷，改用原本存好的方式聯絡${person.name.trim()}一起查證。` : "我先停止對話，再找可信任的人獨立查證。";
  const message = `遇到催促匯款、保密、提供驗證碼或分享螢幕的要求，先不要照做。${personText}需要協助時，在台灣可撥 165 諮詢；有人身安全疑慮請撥 110。`;
  try {
    await navigator.clipboard.writeText(message);
    toast("提醒文字已複製");
  } catch {
    toast("目前無法存取剪貼簿，請手動複製頁面內容");
  }
}

async function restoreBackup(file) {
  if (!file) return;
  if (file.size > 1024 * 1024) {
    toast("備份檔超過 1 MB，沒有載入");
    return;
  }
  try {
    const payload = JSON.parse(await file.text());
    if (!payload?.plan || typeof payload.plan !== "object" || !Array.isArray(payload.plan.contacts)) {
      throw new Error("invalid backup format");
    }
    if (!window.confirm("還原會取代這台裝置目前儲存的應急卡。要繼續嗎？")) return;
    const source = payload.plan;
    const allowedMethods = new Set([...document.querySelectorAll('input[name="verify"]')].map((input) => input.value));
    const allowedSteps = new Set([...document.querySelectorAll("#first-step option")].map((option) => option.value));
    plan = {
      contacts: Array.from({ length: 3 }, (_, index) => {
        const contact = source.contacts[index] ?? {};
        return {
          name: typeof contact.name === "string" ? contact.name.slice(0, 40) : "",
          relation: typeof contact.relation === "string" ? contact.relation.slice(0, 40) : "",
          phone: typeof contact.phone === "string" ? contact.phone.slice(0, 30) : "",
        };
      }),
      verify: Array.isArray(source.verify) ? source.verify.filter((item) => allowedMethods.has(item)) : [],
      safeWord: typeof source.safeWord === "string" ? source.safeWord.slice(0, 40) : "",
      firstStep: allowedSteps.has(source.firstStep) ? source.firstStep : defaultPlan.firstStep,
    };
    savePlan();
    renderContacts();
    setFormFromPlan();
    toast("應急卡已從本機備份還原");
  } catch {
    toast("無法讀取這份備份，請選擇家安小卡匯出的 JSON 檔");
  }
}

document.querySelectorAll("[data-nav]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const name = button.dataset.nav;
    showView(name);
    if (name === "plan") setFormFromPlan();
  });
});

document.querySelectorAll('input[name="verify"]').forEach((input) => {
  input.addEventListener("change", () => {
    plan.verify = [...document.querySelectorAll('input[name="verify"]:checked')].map((item) => item.value);
    savePlan();
  });
});

document.querySelector("#safe-word").addEventListener("input", (event) => {
  plan.safeWord = event.target.value;
  savePlan();
});
document.querySelector("#first-step").addEventListener("change", (event) => {
  plan.firstStep = event.target.value;
  savePlan();
});
document.querySelector("#plan-form").addEventListener("submit", (event) => {
  event.preventDefault();
  savePlan(true);
});
document.querySelector("#print-button").addEventListener("click", () => window.print());
document.querySelector("#download-button").addEventListener("click", downloadBackup);
document.querySelector("#import-button").addEventListener("click", () => document.querySelector("#import-file").click());
document.querySelector("#import-file").addEventListener("change", (event) => {
  restoreBackup(event.target.files?.[0]);
  event.target.value = "";
});
document.querySelector("#copy-button").addEventListener("click", copyReminder);
document.querySelector("#clear-button").addEventListener("click", () => {
  if (!window.confirm("清除這台裝置上儲存的聯絡人與家庭暗號？此操作無法復原。")) return;
  localStorage.removeItem(STORAGE_KEY);
  plan = structuredClone(defaultPlan);
  setFormFromPlan();
  renderContacts();
  updateCard();
  updateDashboard();
  toast("本機資料已清除");
});

renderContacts();
renderScenarios();
setFormFromPlan();
updateCard();
updateDashboard();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

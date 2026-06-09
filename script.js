const defaultApiOrigin =
  window.location.protocol === "file:"
    ? "http://localhost:5000"
    : `${window.location.protocol}//${window.location.hostname}:5000`;
const API_BASE_URL = window.HALL_TICKET_API_URL || `${defaultApiOrigin}/api`;
const EMPTY_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";

const photoInput = document.getElementById("photoInput");
const signInput = document.getElementById("signInput");
const candidatePhoto = document.getElementById("candidatePhoto");
const candidateSign = document.getElementById("candidateSign");
const saveBtn = document.getElementById("saveDataBtn");
const profilesBtn = document.getElementById("profilesBtn");
const profilesDropdown = document.getElementById("profilesDropdown");
const newProfileBtn = document.getElementById("newProfileBtn");
const resetBtn = document.getElementById("resetBtn");
const pdfBtn = document.getElementById("downloadPdfBtn");
const saveStatus = document.getElementById("saveStatus");

const fieldElements = {
  examSession: document.querySelector('[data-field="examSession"]'),
  rollNo: document.querySelector('[data-field="rollNo"]'),
  candidateName: document.querySelector('[data-field="candidateName"]'),
  gender: document.querySelector('[data-field="gender"]'),
  fatherName: document.querySelector('[data-field="fatherName"]'),
  course: document.querySelector('[data-field="course"]'),
  semester: document.querySelector('[data-field="semester"]'),
  printDateTime: document.querySelector('[data-field="printDateTime"]'),
  pageInfo: document.querySelector('[data-field="pageInfo"]'),
};

let currentProfileId = null;
let defaultTicketData;
let savedProfiles = [];
let notificationTimer;

function notify(message, type = "info") {
  window.clearTimeout(notificationTimer);
  saveStatus.textContent = message;
  saveStatus.className = `save-status ${type}`;

  if (message) {
    notificationTimer = window.setTimeout(() => {
      saveStatus.textContent = "";
      saveStatus.className = "save-status";
    }, type === "error" ? 7000 : 4000);
  }
}

function setSaveLoading(isLoading) {
  saveBtn.disabled = isLoading;
  saveBtn.textContent = isLoading ? "Saving..." : "Save Data";
}

function setProfilesLoading(isLoading) {
  profilesBtn.disabled = isLoading;
  profilesBtn.textContent = isLoading ? "Loading..." : "Saved Profiles \u25BE";
}

function cleanText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function getFieldValue(element) {
  if (!element) return "";

  const text = cleanText(element.textContent || "");
  return element.querySelector(".colon") ? text.replace(/^:\s*/, "") : text;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setFieldValue(element, value) {
  if (!element) return;

  const nextValue = value === undefined || value === null ? "" : value;

  if (element.querySelector(".colon")) {
    element.innerHTML = `<span class="colon">:</span> ${escapeHtml(nextValue)}`;
    return;
  }

  element.textContent = nextValue;
}

function collectSubjects() {
  return Array.from(document.querySelectorAll("tbody tr")).map((row) => {
    const cells = row.querySelectorAll("td");

    return {
      subjectCode: cleanText(cells[1]?.textContent || ""),
      subjectName: cleanText(cells[2]?.textContent || ""),
      examDate: cleanText(cells[3]?.textContent || ""),
      timings: cleanText(cells[4]?.textContent || ""),
    };
  });
}

function applySubjects(subjects = []) {
  const rows = document.querySelectorAll("tbody tr");

  rows.forEach((row, index) => {
    const cells = row.querySelectorAll("td");
    const subject = subjects[index] || {};

    cells[1].textContent = subject.subjectCode || "";
    cells[2].textContent = subject.subjectName || "";
    cells[3].textContent = subject.examDate || "";
    cells[4].textContent = subject.timings || "";
  });
}

function collectTicketData() {
  const candidateName = getFieldValue(fieldElements.candidateName);
  const rollNo = getFieldValue(fieldElements.rollNo);

  return {
    profileName: candidateName || rollNo,
    examSession: getFieldValue(fieldElements.examSession),
    rollNo,
    candidateName,
    gender: getFieldValue(fieldElements.gender),
    fatherName: getFieldValue(fieldElements.fatherName),
    course: getFieldValue(fieldElements.course),
    semester: getFieldValue(fieldElements.semester),
    candidatePhoto: candidatePhoto.src,
    candidateSignature: candidateSign.src,
    subjects: collectSubjects(),
    printDateTime: getFieldValue(fieldElements.printDateTime),
    pageInfo: getFieldValue(fieldElements.pageInfo),
  };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image data."));
    reader.readAsDataURL(blob);
  });
}

function imageElementToDataUrl(imageElement) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = imageElement.naturalWidth || imageElement.width;
    canvas.height = imageElement.naturalHeight || imageElement.height;

    const context = canvas.getContext("2d");
    context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/png");
  } catch (error) {
    return "";
  }
}

async function getPortableImageSource(imageElement) {
  if (!imageElement.src || imageElement.src.startsWith("data:")) {
    return imageElement.src;
  }

  try {
    const response = await fetch(imageElement.src);

    if (!response.ok) {
      throw new Error("Image request failed.");
    }

    return await blobToDataUrl(await response.blob());
  } catch (error) {
    return imageElementToDataUrl(imageElement) || imageElement.src;
  }
}

async function collectTicketDataForSave() {
  const ticket = collectTicketData();

  ticket.profileName = ticket.profileName || ticket.candidateName || ticket.rollNo;
  ticket.candidatePhoto = await getPortableImageSource(candidatePhoto);
  ticket.candidateSignature = await getPortableImageSource(candidateSign);

  return ticket;
}

function applyTicketData(ticket, options = {}) {
  if (!ticket) return;

  const shouldSetCurrentProfile = options.setCurrentProfile !== false;

  Object.entries(fieldElements).forEach(([field, element]) => {
    setFieldValue(element, ticket[field]);
  });

  candidatePhoto.src = ticket.candidatePhoto || EMPTY_IMAGE;
  candidateSign.src = ticket.candidateSignature || EMPTY_IMAGE;
  applySubjects(Array.isArray(ticket.subjects) ? ticket.subjects : []);

  if (shouldSetCurrentProfile) {
    currentProfileId = ticket._id || null;
  }
}

function clearTicketData() {
  currentProfileId = null;

  Object.values(fieldElements).forEach((element) => {
    setFieldValue(element, "");
  });

  applySubjects([]);
  candidatePhoto.src = EMPTY_IMAGE;
  candidateSign.src = EMPTY_IMAGE;
  photoInput.value = "";
  signInput.value = "";
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = {};

  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed. Please try again.");
  }

  return data;
}

function getProfileLabel(profile) {
  return profile.profileName || profile.candidateName || profile.rollNo || "Untitled Profile";
}

function renderProfiles() {
  profilesDropdown.innerHTML = "";

  if (!savedProfiles.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "profiles-empty";
    emptyMessage.textContent = "No saved profiles";
    profilesDropdown.appendChild(emptyMessage);
    return;
  }

  savedProfiles.forEach((profile) => {
    const item = document.createElement("div");
    item.className = "profile-item";

    const details = document.createElement("div");
    details.className = "profile-details";

    const name = document.createElement("strong");
    name.textContent = getProfileLabel(profile);

    const meta = document.createElement("span");
    meta.textContent = profile.rollNo ? `Roll No: ${profile.rollNo}` : profile.candidateName || "";

    details.append(name, meta);

    const actions = document.createElement("div");
    actions.className = "profile-actions";

    const loadButton = document.createElement("button");
    loadButton.type = "button";
    loadButton.className = "profile-mini-btn";
    loadButton.dataset.action = "load";
    loadButton.dataset.id = profile._id;
    loadButton.textContent = "Load";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "profile-mini-btn danger";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = profile._id;
    deleteButton.textContent = "Delete";

    actions.append(loadButton, deleteButton);
    item.append(details, actions);
    profilesDropdown.appendChild(item);
  });
}

async function loadProfiles() {
  setProfilesLoading(true);

  try {
    const data = await requestJson(`${API_BASE_URL}/profiles`);
    savedProfiles = Array.isArray(data.profiles) ? data.profiles : [];
    renderProfiles();
    return savedProfiles;
  } catch (error) {
    notify(`Could not load profiles: ${error.message}`, "error");
    return [];
  } finally {
    setProfilesLoading(false);
  }
}

async function loadProfile(profileId, options = {}) {
  try {
    const data = await requestJson(`${API_BASE_URL}/profile/${profileId}`);

    applyTicketData(data.profile);
    profilesDropdown.hidden = true;

    if (options.notifyUser !== false) {
      notify("Profile Loaded", "success");
    }
  } catch (error) {
    notify(`Profile load failed: ${error.message}`, "error");
  }
}

async function saveProfile() {
  let ticketData;
  let isUpdate = false;

  try {
    setSaveLoading(true);
    notify("Saving profile...", "info");

    ticketData = await collectTicketDataForSave();
    isUpdate = Boolean(currentProfileId);
    const data = await requestJson(
      isUpdate ? `${API_BASE_URL}/profile/${currentProfileId}` : `${API_BASE_URL}/profile`,
      {
        method: isUpdate ? "PUT" : "POST",
        body: JSON.stringify(ticketData),
      }
    );

    applyTicketData(data.profile);
    await loadProfiles();
    notify(data.message || (isUpdate ? "Profile Updated" : "Profile Saved"), "success");
  } catch (error) {
    if (isUpdate && error.message.toLowerCase().includes("not found")) {
      try {
        currentProfileId = null;

        const data = await requestJson(`${API_BASE_URL}/profile`, {
          method: "POST",
          body: JSON.stringify(ticketData),
        });

        applyTicketData(data.profile);
        await loadProfiles();
        notify(data.message || "Profile Saved", "success");
        return;
      } catch (retryError) {
        notify(`Save failed: ${retryError.message}`, "error");
        return;
      }
    }

    notify(`Save failed: ${error.message}`, "error");
  } finally {
    setSaveLoading(false);
  }
}

async function deleteProfile(profileId) {
  if (!confirm("Delete this profile?")) {
    return;
  }

  try {
    await requestJson(`${API_BASE_URL}/profile/${profileId}`, {
      method: "DELETE",
    });

    if (currentProfileId === profileId) {
      clearTicketData();
    }

    await loadProfiles();
    notify("Profile Deleted", "success");
  } catch (error) {
    notify(`Delete failed: ${error.message}`, "error");
  }
}

function newBlankProfile() {
  clearTicketData();
  notify("New blank profile ready.", "info");
}

function resetTicket() {
  currentProfileId = null;
  applyTicketData(defaultTicketData, { setCurrentProfile: false });
  notify("Default data restored.", "info");
}

function readImageFile(file, onLoad) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (event) => {
    onLoad(event.target.result);
  };

  reader.onerror = () => {
    notify("Could not read the selected image.", "error");
  };

  reader.readAsDataURL(file);
}

candidatePhoto.addEventListener("click", () => {
  photoInput.click();
});

photoInput.addEventListener("change", (event) => {
  readImageFile(event.target.files[0], (imageData) => {
    candidatePhoto.src = imageData;
    notify("Photo selected. Click Save Data to store it.", "info");
  });
});

candidateSign.addEventListener("click", () => {
  signInput.click();
});

signInput.addEventListener("change", (event) => {
  readImageFile(event.target.files[0], (imageData) => {
    candidateSign.src = imageData;
    notify("Signature selected. Click Save Data to store it.", "info");
  });
});

document.querySelectorAll("[contenteditable='true']").forEach((element) => {
  element.title = "Click and edit";

  element.addEventListener("focus", () => {
    element.style.outline = "1px dashed #666";
  });

  element.addEventListener("blur", () => {
    element.style.outline = "none";
  });
});

pdfBtn.addEventListener("click", async () => {
  const page = document.querySelector(".page");

  const canvas = await html2canvas(page, {
    scale: 2,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = 210;
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save("Hall-Ticket.pdf");
});

profilesBtn.addEventListener("click", async () => {
  const shouldOpen = profilesDropdown.hidden;
  profilesDropdown.hidden = !shouldOpen;

  if (shouldOpen) {
    await loadProfiles();
  }
});

profilesDropdown.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;

  if (action === "load") {
    await loadProfile(id);
  }

  if (action === "delete") {
    await deleteProfile(id);
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".profiles-wrapper")) {
    profilesDropdown.hidden = true;
  }
});

saveBtn.addEventListener("click", saveProfile);
newProfileBtn.addEventListener("click", newBlankProfile);
resetBtn.addEventListener("click", resetTicket);

defaultTicketData = collectTicketData();

loadProfiles().then((profiles) => {
  if (!profiles.length) {
    notify("No saved profiles yet.", "info");
  }
});

function initSubmissionForm() {
    const consentCheckbox = document.getElementById("submissionConsent");
    const startButton = document.getElementById("submissionStartBtn");

    const welcomeStep = document.getElementById("submissionStepWelcome");
    const needStep = document.getElementById("submissionStepNeed");
    const detailsStep = document.getElementById("submissionStepDetails");
    const ratesStep = document.getElementById("submissionStepRates");
    const confirmationStep = document.getElementById("submissionStepConfirmation");

    const requestType = document.getElementById("requestType");
    const platformType = document.getElementById("platformType");
    const stepOneNext = document.getElementById("submissionNext");

    const backToNeed = document.getElementById("submissionBackToNeed");
    const detailsNext = document.getElementById("submissionDetailsNext");

    const ratesConsent = document.getElementById("ratesConsent");
    const backToDetails = document.getElementById("submissionBackToDetails");
    const ratesNext = document.getElementById("submissionRatesNext");

    const backToRates = document.getElementById("submissionBackToRates");
    const finalSendButton = document.getElementById("submissionSendBtn");

    const steps = [welcomeStep, needStep, detailsStep, ratesStep, confirmationStep];

    const requiredDetailsFields = [
        { id: "clientName", label: "Nom" },
        { id: "clientEmail", label: "Courriel" },
        { id: "projectDescription", label: "Description du projet" },
        { id: "expectedResult", label: "Résultat attendu" },
        { id: "budgetType", label: "Budget" },
        { id: "timelineType", label: "Délai" }
    ];

    function showStep(step) {
        if (!step) return;

        steps.forEach((panel) => {
            if (panel) panel.hidden = panel !== step;
        });

        const inForm = step !== welcomeStep && step !== confirmationStep;
        document.body.classList.toggle("mobile-swipe-disabled", inForm);

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function getValue(id) {
        const field = document.getElementById(id);
        return field ? field.value.trim() : "";
    }

    function getSelectText(id) {
        const field = document.getElementById(id);
        if (!field) return "";

        const option = field.options[field.selectedIndex];
        return option ? option.textContent.trim() : field.value.trim();
    }

    function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getPhoneDigits() {
    const phone = document.getElementById("clientPhone");
    return phone ? phone.value.replace(/\D/g, "") : "";
}

function isValidPhoneIfFilled() {
    const digits = getPhoneDigits();

    if (digits.length === 0) return true;

    return digits.length === 11;
}

function getFieldErrorElement(field) {
    if (!field) return null;

    const errorId = `${field.id}Error`;
    let error = document.getElementById(errorId);

    if (!error) {
        error = document.createElement("p");
        error.id = errorId;
        error.className = "submission-field-error";
        error.setAttribute("aria-live", "polite");

        const container = field.closest(".form-group") || field.parentElement;

        if (container) {
            container.appendChild(error);
        }
    }

    return error;
}

function setFieldError(id, message) {
    const field = document.getElementById(id);
    if (!field) return;

    const error = getFieldErrorElement(field);

    if (message) {
        field.classList.add("submission-field-invalid");
        field.setAttribute("aria-invalid", "true");

        if (error) {
            error.textContent = message;
            error.hidden = false;
        }
    } else {
        field.classList.remove("submission-field-invalid");
        field.removeAttribute("aria-invalid");

        if (error) {
            error.textContent = "";
            error.hidden = true;
        }
    }
}

function setDetailsNotice(hasError) {
    const notice = document.getElementById("detailsRequiredNotice");
    if (!notice) return;

    notice.textContent = "* Champs obligatoires";

    if (hasError) {
        notice.classList.add("is-error");
    } else {
        notice.classList.remove("is-error");
    }
}

    function updateStepOneButton() {
        if (!stepOneNext || !requestType || !platformType) return;

        stepOneNext.disabled =
            requestType.value === "" ||
            platformType.value === "";
    }

    function setupRequiredDetailsNotice() {
        if (!detailsNext) return;

        requiredDetailsFields.forEach((item) => {
            const field = document.getElementById(item.id);

            if (field) {
                field.setAttribute("required", "required");
                field.setAttribute("aria-required", "true");
            }
        });

        document.querySelectorAll(".required-star").forEach((star) => {
            star.remove();
        });

        if (!document.getElementById("detailsRequiredNotice")) {
            const notice = document.createElement("p");
            notice.id = "detailsRequiredNotice";
            notice.className = "submission-required-notice";
            notice.textContent = "* Champs obligatoires";

            const actions = detailsNext.closest(".submission-actions") || detailsNext.parentElement;

            if (actions && actions.parentElement) {
                actions.parentElement.insertBefore(notice, actions);
            }
        }
    }

    function updateDetailsButton() {
    if (!detailsNext) return;

    const missingFields = requiredDetailsFields.filter((item) => {
        const field = document.getElementById(item.id);
        return field && field.value.trim() === "";
    });

    const email = getValue("clientEmail");
    const phoneDigits = getPhoneDigits();

    let hasFieldError = false;

    if (email !== "" && !isValidEmail(email)) {
        setFieldError("clientEmail", "Courriel invalide. Exemple : nom@domaine.com");
        hasFieldError = true;
    } else {
        setFieldError("clientEmail", "");
    }

    if (phoneDigits.length > 0 && !isValidPhoneIfFilled()) {
        if (phoneDigits.length === 10) {
            setFieldError("clientPhone", "Téléphone incomplet. Il manque 1 chiffre.");
        } else {
            setFieldError("clientPhone", "Téléphone invalide. Exemple : 1 450 400 3030");
        }

        hasFieldError = true;
    } else {
        setFieldError("clientPhone", "");
    }

    const hasError = missingFields.length > 0 || hasFieldError;

    detailsNext.disabled = hasError;
    setDetailsNotice(hasError);
}

    function formatPhone() {
        const input = document.getElementById("clientPhone");
        if (!input) return;

        input.addEventListener("input", () => {
            let digits = input.value.replace(/\D/g, "").substring(0, 11);
            let formatted = "";

            if (digits.length > 0) formatted += digits.substring(0, 1);
            if (digits.length > 1) formatted += " " + digits.substring(1, 4);
            if (digits.length > 4) formatted += " " + digits.substring(4, 7);
            if (digits.length > 7) formatted += " " + digits.substring(7, 11);

            input.value = formatted.trim();
        });
    }

    function formatExtension() {
        const input = document.getElementById("clientExtension");
        if (!input) return;

        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "").substring(0, 8);
        });
    }

    function setupCharacterCounter(textareaId, counterId, maxLength) {
        const textarea = document.getElementById(textareaId);
        const counter = document.getElementById(counterId);

        if (!textarea || !counter) return;

        function updateCounter() {
            counter.textContent = `${textarea.value.length} / ${maxLength}`;
        }

        textarea.addEventListener("input", updateCounter);
        updateCounter();
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    

    if (consentCheckbox && startButton) {
        startButton.disabled = !consentCheckbox.checked;

        consentCheckbox.addEventListener("change", () => {
            startButton.disabled = !consentCheckbox.checked;
        });
    }

    if (startButton) {
        startButton.addEventListener("click", () => {
            showStep(needStep);
        });
    }

    if (requestType) {
        requestType.addEventListener("change", updateStepOneButton);
    }

    if (platformType) {
        platformType.addEventListener("change", updateStepOneButton);
    }

    if (stepOneNext) {
        stepOneNext.addEventListener("click", () => {
            showStep(detailsStep);
        });
    }

    if (backToNeed) {
        backToNeed.addEventListener("click", () => {
            showStep(needStep);
        });
    }

    if (detailsNext) {
        detailsNext.addEventListener("click", () => {
            showStep(ratesStep);
        });
    }

    [
        "clientName",
        "clientEmail",
        "clientPhone",
        "clientExtension",
        "clientCompany",
        "projectName",
        "projectDescription",
        "expectedResult",
        "budgetType",
        "timelineType"
    ].forEach((id) => {
        const field = document.getElementById(id);

        if (field) {
            field.addEventListener("input", updateDetailsButton);
            field.addEventListener("change", updateDetailsButton);
        }
    });

    if (ratesConsent && ratesNext) {
        ratesNext.disabled = !ratesConsent.checked;

        ratesConsent.addEventListener("change", () => {
            ratesNext.disabled = !ratesConsent.checked;
        });
    }

    if (backToDetails) {
        backToDetails.addEventListener("click", () => {
            showStep(detailsStep);
        });
    }

    if (ratesNext) {
    ratesNext.addEventListener("click", async () => {
        ratesNext.disabled = true;
        ratesNext.textContent = "Envoi...";

        const formData = {
            nature: getSelectText("requestType"),
            plateforme: getSelectText("platformType"),
            nom: getValue("clientName"),
            courriel: getValue("clientEmail"),
            telephone: getValue("clientPhone"),
            extension: getValue("clientExtension"),
            entreprise: getValue("clientCompany"),
            projet: getValue("projectName"),
            description: getValue("projectDescription"),
            resultat: getValue("expectedResult"),
            budget: getSelectText("budgetType"),
            montant: getSelectText("budgetAmount"),
            delai: getSelectText("timelineType")
        };

        try {
            const response = await fetch("https://formspree.io/f/xlgyagna", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error("Erreur d'envoi");
            }

            showStep(confirmationStep);
        } catch (error) {
            alert("L'envoi a échoué. Veuillez réessayer dans quelques minutes.");
            ratesNext.disabled = false;
            ratesNext.textContent = "Continuer";
        }
    });
}

    if (backToRates) {
        backToRates.addEventListener("click", () => {
            showStep(ratesStep);
        });
    }

    if (finalSendButton) {
        finalSendButton.addEventListener("click", () => {
            alert("Demande prête à être envoyée. L'envoi sécurisé sera branché ensuite.");
        });
    }

    setupRequiredDetailsNotice();

    formatPhone();
    formatExtension();

    setupCharacterCounter("projectDescription", "projectDescriptionCounter", 5000);
    setupCharacterCounter("expectedResult", "expectedResultCounter", 1500);

    updateStepOneButton();
    updateDetailsButton();
    
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSubmissionForm);
} else {
    initSubmissionForm();
}

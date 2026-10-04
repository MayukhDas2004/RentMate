const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    document.querySelectorAll(".is-invalid").forEach(field => {
        field.classList.remove("is-invalid");
    });
    
    document.querySelectorAll(".invalid-feedback").forEach(error => {
        error.textContent = "";
    });

    const formData = new FormData(registerForm);

    const response = await fetch("/register", {
        method: "POST",
        headers: {
            "Accept": "application/json"
        },
        body: new URLSearchParams(formData)
    });

    const data = await response.json();

    if (!data.success) {

        if (data.field) {
            const field = document.getElementById(data.field);
            const errorMessage = document.getElementById(data.field + "Error");
    
            if (field && errorMessage) {
                field.classList.add("is-invalid");
                errorMessage.textContent = data.message;
            }
        } else {
            alert(data.message);
        }
    
        return;
    }
    if (data.success) {
        window.location.href = data.redirect;
    }
});

const sendOtpBtn = document.getElementById("sendOtpBtn");


sendOtpBtn.addEventListener("click", async () => {
    const ContactNumber = document.getElementById("ContactNumber").value;

    if (!/^[0-9]{10}$/.test(ContactNumber)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
    }

    const response = await fetch("/send-phone-otp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ ContactNumber })
    });

    const data = await response.json();

    alert(data.message);
});


const verifyOtpBtn = document.getElementById("verifyOtpBtn");

verifyOtpBtn.addEventListener("click", async () => {
    const ContactNumber = document.getElementById("ContactNumber").value;
    const otp = document.getElementById("otp").value;

    if (!otp || otp.length !== 6) {
        alert("Please enter the 6-digit OTP.");
        return;
    }

    const response = await fetch("/verify-phone-otp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ContactNumber,
            otp
        })
    });

    const data = await response.json();

    alert(data.message);

    if (data.success) {
        document.getElementById("registerBtn").disabled = false;
    }
});


document.querySelectorAll("#registerForm input, #registerForm select, #registerForm textarea")
    .forEach(field => {
        field.addEventListener("input", () => {
            field.classList.remove("is-invalid");

            const errorMessage = document.getElementById(field.id + "Error");

            if (errorMessage) {
                errorMessage.textContent = "";
            }
        });

        field.addEventListener("change", () => {
            field.classList.remove("is-invalid");

            const errorMessage = document.getElementById(field.id + "Error");

            if (errorMessage) {
                errorMessage.textContent = "";
            }
        });
    });
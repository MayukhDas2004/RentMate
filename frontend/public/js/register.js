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
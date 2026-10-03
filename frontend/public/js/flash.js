setTimeout(() => {
    const alerts = document.querySelectorAll(".rm-flash");

    alerts.forEach(alert => {
        const closeButton = alert.querySelector(".btn-close");

        if (closeButton) {
            closeButton.click();
        }
    });
}, 4000);
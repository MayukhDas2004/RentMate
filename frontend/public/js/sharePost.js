const shareButton = document.querySelector("#sharePostBtn");

if (shareButton) {
    shareButton.addEventListener("click", async () => {
        const url = new URL(window.location.href);
        url.search = "";
        const postUrl = url.toString();

        if (navigator.share) {
            await navigator.share({
                title: "RentMate Property",
                text: "Check out this property on RentMate.",
                url: postUrl
            });
        } else {
            await navigator.clipboard.writeText(postUrl);
            alert("Post link copied!");
        }
    });
}
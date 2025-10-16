function addNoCheatListeners(doc) {
    doc.oncontextmenu = () => {
        return false;
    };
    doc.onkeydown = e => {
        if (e.key === "F12") {
            return false;
        }
        if ((e.ctrlKey && e.key === "u") || (e.ctrlKey && e.key === "U")) {
            return false;
        }
        if ((e.ctrlKey && e.shiftKey && e.key === "J") || (e.ctrlKey && e.key === "j")) {
            return false;
        }
        if ((e.ctrlKey && e.shiftKey && e.key === "C") || (e.ctrlKey && e.key === "c")) {
            return false;
        }
        if ((e.ctrlKey && e.shiftKey && e.key === "I") || (e.ctrlKey && e.key === "i")) {
            return false;
        }
    };
    doc.addEventListener('keydown', function(e) {
        if ((e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.shiftKey && e.key === 'i')) {
            e.preventDefault();
            return false;
        }
    });
}


function addListenersToIframes() {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            addNoCheatListeners(iframeDoc);
        } catch (e) {
            console.error('Could not access iframe document:', e);
        }
    });
}
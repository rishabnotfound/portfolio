(function() {
    const whitelistedIPs = ["PUT YOUR IP HERE HAHAHA I'LL DDOS" ];
    function isIPWhitelisted(ip) {
        return whitelistedIPs.includes(ip);
    }
    function detectDebugger() {
        const start = new Date();
        debugger;
        const end = new Date();
        if (end - start > 100) {
        }
    }
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            const ip = data.ip;
            if (!isIPWhitelisted(ip)) {
                devtoolsDetector.addListener(isOpen => {
                    if (isOpen) {
                        detectDebugger();
                    }
                });
                devtoolsDetector.launch();
                setInterval(detectDebugger, 1000);
            }
        })
        .catch(error => console.error('Error getting IP address:', error));
})();

function sendMessage(msg)
{
	window.chrome.webview.postMessage(msg);
}

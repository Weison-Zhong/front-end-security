import React from "react";
import ReactDOM from "react-dom/client";
const htmlText = `
<span>test DOM XSS</span>
<script>alert('script')</script>
<img src="wrongUrl" onerror ="alert('DOM型XSS攻击')">
`;
function App() {
  return (
    <div>
      {htmlText}
      <p
        dangerouslySetInnerHTML={{
          __html: encodeHTML(htmlText),
        }}
      ></p>
    </div>
  );
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

function encodeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

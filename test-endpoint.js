// Test script para verificar si la ruta existe
const url = "http://localhost:3000/api/stripe/create-checkout-session";

const payload = {
  amount: 500,
  service: "Electricidad",
  serviceId: "cfe",
  paymentMethod: "card"
};

console.log("Testing endpoint:", url);
console.log("Payload:", payload);

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})
  .then(response => {
    console.log("Response status:", response.status);
    console.log("Response OK:", response.ok);
    return response.text();
  })
  .then(text => {
    console.log("Response body:", text.substring(0, 500));
    try {
      const json = JSON.parse(text);
      console.log("Parsed JSON:", json);
    } catch (e) {
      console.log("Not JSON, raw text above");
    }
  })
  .catch(err => console.error("Error:", err));

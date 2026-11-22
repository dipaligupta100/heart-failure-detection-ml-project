# CardioCare frontend

A responsive HTML/CSS/JavaScript interface for an academic Heart Failure Clinical Records prediction project.

## Files
- `index.html` — login/signup and dashboard
- `css/style.css` — responsive styling
- `js/app.js` — demo auth, form validation, API request

## Run
Open this folder in VS Code and use the Live Server extension, or run a local static server:
```bash
python -m http.server 5500
```
Then visit `http://127.0.0.1:5500`.

## Backend contract
The frontend sends a JSON POST to `http://127.0.0.1:8000/predict` with these 12 fields:
`age`, `anaemia`, `creatinine_phosphokinase`, `diabetes`, `ejection_fraction`,
`high_blood_pressure`, `platelets`, `serum_creatinine`, `serum_sodium`, `sex`, `smoking`, `time`.

Expected response:
```json
{"prediction": 0}
```
Change `API_BASE_URL` at the top of `js/app.js` if your backend uses another URL.
Your backend must enable CORS for the frontend origin.

## Important limitations
- Login/signup is a browser-only demo using localStorage. Passwords are stored in the browser and are NOT secure. Do not use real credentials. Replace with server-side authentication before deployment.
- The interface does not fabricate predictions. If the backend is unavailable or the response format differs, it displays an error.
- The standard UCI dataset target is `DEATH_EVENT` (a death event during the study follow-up), not a clinical diagnosis of heart failure. Align your model target and UI wording with your actual dataset.
- Educational/research use only; not for diagnosis or treatment.

# Contact Manager

Student: Zlatovcen Bogdan  
Profesor: Ovidiu Gherman  
Repository GitHub: https://github.com/bogdan-404/twa.git

Contact Manager este o aplicație web pentru gestionarea contactelor personale. Utilizatorii își pot crea cont, se pot autentifica, pot adăuga contacte, pot vedea lista de contacte, pot edita detalii și pot șterge contacte. Fiecare utilizator vede doar contactele proprii.

## Tehnologii utilizate

- FastAPI pentru backend și API REST.
- React.js cu Vite pentru frontend.
- Ant Design pentru componente UI.
- SQLite3 ca bază de date serverless.
- JWT pentru autentificare pe bază de token.
- passlib/bcrypt pentru hash-ul parolelor.
- Docker pentru containerizare.
- Render.com pentru deployment.

## Funcționalități principale

- Înregistrare și autentificare cu username și parolă.
- Parole salvate doar ca hash bcrypt.
- Token JWT trimis prin `Authorization: Bearer <token>`.
- Operații CRUD pentru contacte.
- Separarea datelor pe utilizator autentificat.
- Interfață React cu Ant Design.
- Servire frontend React construit direct din FastAPI în producție.

## Endpoint-uri API

| Method | Endpoint | Protected | Descriere |
| --- | --- | --- | --- |
| GET | `/healthz` | Nu | Verifică starea aplicației |
| POST | `/api/auth/register` | Nu | Creează un cont nou |
| POST | `/api/auth/login` | Nu | Autentifică utilizatorul și returnează token JWT |
| GET | `/api/auth/me` | Da | Returnează utilizatorul curent |
| GET | `/api/contacts` | Da | Returnează contactele utilizatorului curent |
| GET | `/api/contacts/{contact_id}` | Da | Returnează un contact propriu |
| POST | `/api/contacts` | Da | Creează un contact nou |
| PUT | `/api/contacts/{contact_id}` | Da | Actualizează un contact propriu |
| DELETE | `/api/contacts/{contact_id}` | Da | Șterge un contact propriu |

## Rulare locală backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend-ul va fi disponibil la `http://localhost:8000`.

## Rulare locală frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend-ul va fi disponibil la `http://localhost:5173`. Configurația Vite trimite cererile `/api` către backend-ul local.

## Rulare cu Docker

```bash
docker build -t twa-contact-manager .
docker run --rm -p 8000:8000 \
  -e SECRET_KEY=change-me-in-production \
  -e ALGORITHM=HS256 \
  -e ACCESS_TOKEN_EXPIRE_MINUTES=60 \
  -e DATABASE_PATH=contact_manager.db \
  twa-contact-manager
```

Aplicația completă va fi disponibilă la `http://localhost:8000`.

## Deployment pe Render.com

1. Încărcați proiectul în repository-ul GitHub: `https://github.com/bogdan-404/twa.git`.
2. În Render, creați un serviciu nou de tip Web Service din repository.
3. Alegeți runtime Docker sau folosiți fișierul `render.yaml`.
4. Verificați variabilele de mediu:
   - `SECRET_KEY`
   - `ALGORITHM=HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES=60`
   - `DATABASE_PATH=/tmp/contact_manager.db`
   - `PYTHONUNBUFFERED=1`
5. Health check path: `/healthz`.
6. Porniți deployment-ul.

## Observație despre Render Free

Aplicația folosește SQLite3 conform cerinței laboratorului. În mediul local, baza de date persistă în fișierul `contact_manager.db`. În deployment-ul gratuit pe Render, baza SQLite este utilizată pentru demonstrație, însă fișierul local poate fi resetat la redeploy, restart sau spin-down, deoarece sistemul de fișiere al serviciilor gratuite este efemer. De asemenea, serviciul gratuit poate intra în stare de repaus după o perioadă de inactivitate, iar prima accesare ulterioară poate dura mai mult.

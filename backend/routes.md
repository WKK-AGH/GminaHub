# Lista ścieżek API

## Legenda

- Auth: wymagana autentykacja (Tak / Nie)
- Uprawnienia: JWT = wymagany token JWT, ADMINISTRATOR / PRZEWODNICZACY =
  wymagana określona rola

## Główne endpointy

| Metoda | Ścieżka   | Opis           | Auth | Wyjście                              |
| ------ | --------- | -------------- | ---- | ------------------------------------ |
| GET    | `/`       | Powitanie      | Nie  | `{ message: "Witamy w API..." }`     |
| GET    | `/health` | Status serwera | Nie  | `{ status: "OK", timestamp: "..." }` |

## Autentykacja (`/api/auth`)

| Metoda | Ścieżka              | Opis                    | Uprawnienia        | Wejście                    | Wyjście                |
| ------ | -------------------- | ----------------------- | ------------------ | -------------------------- | ---------------------- |
| POST   | `/api/auth/login`    | Logowanie               | Nie                | `{ email, password }`      | `{ token, user, ... }` |
| POST   | `/api/auth/logout`   | Wylogowanie             | Nie                | `-`                        | `{ success: true }`    |
| POST   | `/api/auth/refresh`  | Odświeżenie tokenu      | Nie                | `-`                        | `{ token, ... }`       |
| POST   | `/api/auth/register` | Rejestracja użytkownika | Tak, ADMINISTRATOR | `{ email, password, ... }` | `{ user, ... }`        |

## Sesje (`/api/sessions`)

| Metoda | Ścieżka                        | Opis                            | Uprawnienia                        | Wejście                | Wyjście                 |
| ------ | ------------------------------ | ------------------------------- | ---------------------------------- | ---------------------- | ----------------------- |
| GET    | `/api/sessions`                | Pobierz wszystkie sesje         | Nie                                | `-`                    | `[ {...}, {...}, ... ]` |
| GET    | `/api/sessions/:id`            | Pobierz sesję po ID             | Nie                                | `-`                    | `{ id, title, ... }`    |
| GET    | `/api/sessions/:id/statistics` | Statystyki sesji                | Tak, JWT                           | `-`                    | `{ stats, ... }`        |
| POST   | `/api/sessions`                | Utwórz sesję                    | Tak, ADMINISTRATOR, PRZEWODNICZACY | `{ title, date, ... }` | `{ id, ... }`           |
| PATCH  | `/api/sessions/:id/status`     | Zmień status sesji              | Tak, ADMINISTRATOR, PRZEWODNICZACY | `{ status }`           | `{ updated: true }`     |
| POST   | `/api/sessions/:id/agenda`     | Dodaj punkt do porządku         | Tak, ADMINISTRATOR, PRZEWODNICZACY | `{ title, ... }`       | `{ agendaItem, ... }`   |
| POST   | `/api/sessions/:id/summary`    | Utwórz/zaktualizuj podsumowanie | Tak, ADMINISTRATOR, PRZEWODNICZACY | `{ summary, ... }`     | `{ summaryId, ... }`    |

## Użytkownicy (`/api/users`)

| Metoda | Ścieżka      | Opis                            | Uprawnienia                        | Wejście | Wyjście                 |
| ------ | ------------ | ------------------------------- | ---------------------------------- | ------- | ----------------------- |
| GET    | `/api/users` | Pobierz wszystkich użytkowników | Tak, ADMINISTRATOR, PRZEWODNICZACY | `-`     | `[ {...}, {...}, ... ]` |

## Głosowania (`/api/votings`)

| Metoda | Ścieżka                  | Opis                  | Uprawnienia                        | Wejście | Wyjście                                       |
| ------ | ------------------------ | --------------------- | ---------------------------------- | ------- | --------------------------------------------- |
| PATCH  | `/api/votings/:id/start` | Rozpocznij głosowanie | Tak, ADMINISTRATOR, PRZEWODNICZACY | `-`     | `{ votingId, status: "started" }`             |
| PATCH  | `/api/votings/:id/end`   | Zakończ głosowanie    | Tak, ADMINISTRATOR, PRZEWODNICZACY | `-`     | `{ votingId, status: "ended", results: ... }` |

## Komisje (`/api/committees`)

| Metoda | Ścieżka                       | Opis                      | Uprawnienia                        | Wejście           | Wyjście                 |
| ------ | ----------------------------- | ------------------------- | ---------------------------------- | ----------------- | ----------------------- |
| GET    | `/api/committees`             | Pobierz wszystkie komisje | Tak, JWT                           | `-`               | `[ {...}, {...}, ... ]` |
| POST   | `/api/committees`             | Utwórz komisję            | Tak, ADMINISTRATOR, PRZEWODNICZACY | `{ name, ... }`   | `{ id, ... }`           |
| POST   | `/api/committees/:id/members` | Dodaj członka do komisji  | Tak, ADMINISTRATOR, PRZEWODNICZACY | `{ userId, ... }` | `{ memberId, ... }`     |

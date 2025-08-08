const API =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:3000";

export async function signup(email: string, password: string) {
  const r = await fetch(`${API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as { token: string };
}

export async function login(email: string, password: string) {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as { token: string };
}

export async function postWorkout(token: string, workout: unknown) {
  const r = await fetch(`${API}/workouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(workout),
  });
  if (!r.ok) throw new Error(await r.text());
}

export async function deleteWorkout(token: string, id: string) {
  const res = await fetch(`${API}/workouts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
}


export async function getWorkouts(token: string) {
  const r = await fetch(`${API}/workouts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(await r.text());
  return await r.json();
}

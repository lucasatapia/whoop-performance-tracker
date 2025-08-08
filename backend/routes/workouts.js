// backend/routes/workouts.js
import { Router } from "express";
import pg from "pg";
import { authRequired } from "../middleware/auth.js";

const router = Router();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

/* ----------  POST /workouts  ---------- *
   Body shape:
   {
     "date": "2025-07-26",
     "note": "Leg day",
     "sets": [
       { "exercise": "Squat", "reps": 5, "weight_kg": 120, "is_top_set": true },
       { "exercise": "Squat", "reps": 5, "weight_kg": 110 }
     ]
   }
*/
router.post("/", authRequired, async (req, res) => {
  const { date, note, sets = [] } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO workouts (user_id, date, note)
       VALUES ($1,$2,$3) RETURNING id`,
      [req.user.id, date, note]
    );
    const workoutId = rows[0].id;

    if (sets.length) {
      const values = sets
        .map(
          (_, i) =>
            `($1, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, $${i * 4 + 5})`
        )
        .join(",");
      const params = [workoutId].concat(
        sets.flatMap((s) => [
          s.exercise,
          s.reps,
          s.weight_kg,
          !!s.is_top_set,
        ])
      );
      await client.query(
        `INSERT INTO sets (workout_id, exercise, reps, weight_kg, is_top_set)
         VALUES ${values}`,
        params
      );
    }

    await client.query("COMMIT");
    res.sendStatus(201);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "workout save failed" });
  } finally {
    client.release();
  }
});

/* ----------  GET /workouts  ---------- */
router.get("/", authRequired, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT w.*, json_agg(s.*) AS sets
       FROM workouts w
       LEFT JOIN sets s ON s.workout_id = w.id
      WHERE w.user_id = $1
   GROUP BY w.id
   ORDER BY w.date DESC`,
    [req.user.id]
  );
  res.json(rows);
});

export default router;

router.delete("/:id", authRequired, async (req, res) => {
  try {
    await pool.query("DELETE FROM workouts WHERE id=$1 AND user_id=$2", [
      req.params.id,
      req.user.id,
    ]);
    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    res.status(500).send("delete failed");
  }
});

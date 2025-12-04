// src/routes/taskRoutes.js
const express = require("express");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { createTask, listEmployees, getManagerTasks,  deleteTask, getEmployeeTasks, employeeUpdateTaskStatus } = require("../controllers/taskController");

const router = express.Router();

// Manager creates & assigns task
router.post("/", auth, requireRole("manager"), createTask);

// Manager gets list of employees for dropdown (optional)
router.get("/employees", auth, requireRole("manager"), listEmployees);

// Manager sees all tasks they have assigned (for the big table)
router.get("/manager", auth, requireRole("manager"), getManagerTasks);

router.get("/my", auth, requireRole("employee"), getEmployeeTasks);

// Employee updates status of their task (Pending → In Progress → Completed)
router.patch(
  "/:id/status",
  auth,
  requireRole("employee"),
  employeeUpdateTaskStatus
);

// Manager deletes a task (trash icon)
router.delete("/:id", auth, requireRole("manager"), deleteTask);


module.exports = router;

// src/controllers/taskController.js
const Task = require("../models/Task");
const User = require("../models/User");

// POST /api/tasks  (manager only)
const createTask = async (req, res) => {
  try {
    const { title, description, priority, employeeName, dueDate } = req.body;

    if (!title || !employeeName) {
      return res
        .status(400)
        .json({ message: "Title and employeeName are required" });
    }

    // Find employee by name
    const employee = await User.findOne({ name: employeeName });

    if (!employee) {
      return res
        .status(404)
        .json({ message: `Employee with name '${employeeName}' not found` });
    }

    if (employee.role !== "employee") {
      return res
        .status(400)
        .json({ message: "Task can only be assigned to employees" });
    }

    // Create task
    const task = await Task.create({
      title,
      description: description || "",
      priority: priority ? priority.toLowerCase() : "medium",
      assignedTo: employee._id,
      createdBy: req.user.id, // manager from JWT
      dueDate: dueDate || null,
    });

    // ✅ Correct populate usage
    await task.populate([
      { path: "assignedTo", select: "name email role" },
      { path: "createdBy", select: "name email role" },
    ]);

    return res.status(201).json({
      message: "Task created and assigned successfully",
      task, // populated doc
    });
  } catch (err) {
    console.error("Create task error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
// (Optional) Get all employees for dropdown
const listEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("id name email");
    return res.json({ employees });
  } catch (err) {
    console.error("List employees error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// GET /api/tasks/manager  (all tasks created by logged-in manager)
const getManagerTasks = async (req, res) => {
  try {
    // req.user.id comes from auth middleware (JWT)
    const tasks = await Task.find({ createdBy: req.user.id })
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 }); // newest first

    return res.json({ tasks });
  } catch (err) {
    console.error("Get manager tasks error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



// DELETE /api/tasks/:id  (manager deletes a task)
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndDelete({
      _id: id,
      createdBy: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Delete task error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
// ========== EMPLOYEE FUNCTIONS ==========

// Employee sees ONLY their tasks
const getEmployeeTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.json({ tasks });
  } catch (err) {
    console.error("Get employee tasks error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Employee updates status of THEIR task
const employeeUpdateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "inprogress", "completed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be one of: pending, in_progress, completed",
      });
    }

    // Only allow updating if task is assigned to this employee
    const task = await Task.findOneAndUpdate(
      { _id: id, assignedTo: req.user.id },
      { status },
      { new: true }
    ).populate("createdBy", "name email role");

    if (!task) {
      return res.status(404).json({
        message: "Task not found or not assigned to this employee",
      });
    }

    return res.json({
      message: "Task status updated",
      task,
    });
  } catch (err) {
    console.error("Employee update task status error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
module.exports = {
  createTask,
  listEmployees,
  getManagerTasks,
  deleteTask,
  getEmployeeTasks,
  employeeUpdateTaskStatus,
};


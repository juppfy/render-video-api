import express from "express";
import { apiKeyAuth } from "../middleware/apiKeyAuth";
import { createRenderJob, getJob, listJobs } from "../modules/render/handlers";

export const v1Router = express.Router();

// Create a longform render job
v1Router.post("/render", apiKeyAuth, createRenderJob);

// Get a single job
v1Router.get("/jobs/:id", apiKeyAuth, getJob);

// List jobs for the current user
v1Router.get("/jobs", apiKeyAuth, listJobs);



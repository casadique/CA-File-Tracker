const express = require("express");
const recurring = require("../services/recurringWorkService");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/dashboard", async (req,res,next)=>{try{res.json(await recurring.dashboard(req.profile));}catch(error){next(error);}});
router.get("/occurrences", async (req,res,next)=>{try{res.json(await recurring.listOccurrences(req.query,req.profile));}catch(error){next(error);}});
router.get("/templates", async (req,res,next)=>{try{res.json({templates:await recurring.templates(req.query.all==="true")});}catch(error){next(error);}});
router.post("/templates", requireRole("Admin","Manager","Staff Manager"), async (req,res,next)=>{try{res.status(201).json({template:await recurring.saveTemplate(req.body||{},req)});}catch(error){next(error);}});
router.put("/templates/:id", requireRole("Admin","Manager","Staff Manager"), async (req,res,next)=>{try{res.json({template:await recurring.saveTemplate({...req.body,id:req.params.id},req)});}catch(error){next(error);}});
router.get("/settings", requireRole("Admin","Manager","Staff Manager"), async (_req,res,next)=>{try{res.json({settings:await recurring.settings()});}catch(error){next(error);}});
router.put("/settings", requireRole("Admin"), async (req,res,next)=>{try{res.json({settings:await recurring.saveSettings(req.body||{},req)});}catch(error){next(error);}});
router.post("/bulk", requireRole("Admin","Manager","Staff Manager"), async (req,res,next)=>{try{const rows=Array.isArray(req.body.schedules)?req.body.schedules:[];if(!rows.length)return res.status(400).json({error:"No schedules were supplied."});const validation=[];for(let i=0;i<rows.length;i+=1){try{await recurring.createSchedule(rows[i],req);validation.push({row:i+1,created:true});}catch(error){validation.push({row:i+1,created:false,error:error.message});}}res.status(validation.some(x=>!x.created)?207:201).json({results:validation,created:validation.filter(x=>x.created).length,failed:validation.filter(x=>!x.created).length});}catch(error){next(error);}});
router.get("/", async (req,res,next)=>{try{res.json(await recurring.listSchedules(req.query,req.profile));}catch(error){next(error);}});
router.post("/", requireRole("Admin","Manager","Staff Manager"), async (req,res,next)=>{try{res.status(201).json(await recurring.createSchedule(req.body||{},req));}catch(error){next(error);}});
router.get("/:id", async (req,res,next)=>{try{res.json(await recurring.getSchedule(req.params.id,req.profile));}catch(error){next(error);}});
router.put("/:id", requireRole("Admin","Manager","Staff Manager"), async (req,res,next)=>{try{res.json(await recurring.updateSchedule(req.params.id,req.body||{},req));}catch(error){next(error);}});
router.post("/:id/generate", requireRole("Admin","Manager","Staff Manager"), async (req,res,next)=>{try{res.json(await recurring.generate(req.params.id,req,true));}catch(error){next(error);}});
router.post("/:id/:action", requireRole("Admin","Manager","Staff Manager"), async (req,res,next)=>{try{res.json(await recurring.control(req.params.id,req.params.action,req.body||{},req));}catch(error){next(error);}});

module.exports = router;

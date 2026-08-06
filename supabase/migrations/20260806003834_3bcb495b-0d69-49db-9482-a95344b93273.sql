
REVOKE EXECUTE ON FUNCTION public.notify_user(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_mentions(text, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_post_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_comment_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_reaction_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_follow_created() FROM PUBLIC, anon, authenticated;

INSERT INTO public.quiz_questions (category, difficulty, question, options, answer) VALUES
('AI Art','easy','Which model family is best known for text-to-image generation?','["Stable Diffusion","BERT","Whisper","Pandas"]',0),
('AI Art','easy','A "negative prompt" tells an image model to…','["Avoid certain elements","Run faster","Use more colour","Save the file"]',0),
('AI Art','medium','Which setting controls how closely an image follows your prompt?','["CFG / guidance scale","Seed","Sampler count","DPI"]',0),
('AI Art','hard','ControlNet is mainly used to…','["Guide composition with a reference structure","Upscale audio","Compress models","Translate prompts"]',0),
('AI Photo','easy','Upscaling an AI photo mainly improves…','["Resolution and detail","Colour theory","File format","Prompt length"]',0),
('AI Photo','medium','Inpainting lets you…','["Regenerate part of an image","Merge two models","Export to PDF","Add audio"]',0),
('AI Photo','hard','Which artefact most often reveals AI-generated portraits?','["Malformed hands and text","Perfect symmetry","Low contrast","Wide aspect ratio"]',0),
('AI Video','easy','Which tool is known for AI video generation?','["Runway","Notion","Trello","Slack"]',0),
('AI Video','medium','Frame interpolation is used to…','["Create smoother motion","Reduce colours","Add subtitles","Crop a video"]',0),
('AI Video','hard','Temporal consistency in AI video refers to…','["Stability of details across frames","Audio bitrate","Render queue order","Export codec"]',0),
('AI Music','easy','Which platform generates full songs from a text prompt?','["Suno","Figma","Postman","Vercel"]',0),
('AI Music','medium','Stem separation splits a track into…','["Vocals and instruments","Bits and bytes","Frames","Layers of text"]',0),
('AI Music','hard','A MIDI file stores…','["Note and timing data","Raw audio waveforms","Compressed video","Vector art"]',0),
('Graphic Design','easy','CMYK is a colour model used mainly for…','["Print","Web","Audio","3D"]',0),
('Graphic Design','easy','Which file format supports transparency?','["PNG","JPG","BMP","CSV"]',0),
('Graphic Design','medium','Kerning adjusts…','["Space between letters","Line height","Image sharpness","Colour balance"]',0),
('Graphic Design','hard','A vector graphic scales without loss because it stores…','["Mathematical paths","Pixels","Bitmaps","Frames"]',0),
('UI/UX','easy','A wireframe is best described as…','["A low-fidelity layout sketch","A final visual design","A database plan","A colour palette"]',0),
('UI/UX','medium','WCAG guidelines cover…','["Accessibility","Hosting","Version control","SEO only"]',0),
('UI/UX','hard','Fitts''s Law relates target size and distance to…','["Time to acquire a target","Colour contrast","Text readability","Load time"]',0),
('Programming','easy','Which language runs natively in the browser?','["JavaScript","Python","Rust","Go"]',0),
('Programming','easy','Git is primarily used for…','["Version control","Image editing","Hosting email","3D rendering"]',0),
('Programming','medium','What does API stand for?','["Application Programming Interface","Applied Program Input","Automatic Process Index","App Protocol Interface"]',0),
('Programming','hard','Big-O notation describes…','["Algorithm growth rate","Screen size","Memory brand","Network cable type"]',0),
('Automation','easy','Zapier and Make are used to…','["Connect apps into workflows","Edit photos","Compile code","Host videos"]',0),
('Automation','medium','A webhook is…','["An HTTP callback triggered by an event","A database index","A CSS rule","A GPU driver"]',0),
('Automation','hard','Idempotency in automation means…','["Repeating a call has the same effect","Running faster each time","Retrying is forbidden","Data is encrypted"]',0),
('Prompting','easy','Giving an AI worked examples in the prompt is called…','["Few-shot","Zero-shot","Fine-tuning","Chaining"]',0),
('Prompting','medium','A system prompt usually sets the model''s…','["Role and rules","Font","Screen size","Battery use"]',0),
('Prompting','hard','Higher temperature generally makes output…','["More random","More factual","Shorter","Slower"]',0);

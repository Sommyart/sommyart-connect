
-- QUIZ QUESTIONS
CREATE TABLE public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  difficulty text not null default 'easy',
  question text not null,
  options text[] not null,
  answer_index smallint not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.quiz_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quiz questions are public" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Admins insert quiz" ON public.quiz_questions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update quiz" ON public.quiz_questions FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete quiz" ON public.quiz_questions FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER quiz_questions_updated BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RIDDLES
CREATE TABLE public.riddles (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  answer text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.riddles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riddles TO authenticated;
GRANT ALL ON public.riddles TO service_role;
ALTER TABLE public.riddles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Riddles are public" ON public.riddles FOR SELECT USING (true);
CREATE POLICY "Admins insert riddles" ON public.riddles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update riddles" ON public.riddles FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete riddles" ON public.riddles FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER riddles_updated BEFORE UPDATE ON public.riddles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MEMBER POINTS (public leaderboard)
CREATE TABLE public.member_points (
  member_id uuid primary key references public.members(id) on delete cascade,
  nickname text not null,
  profile_picture text,
  total_points integer not null default 0,
  quizzes_played integer not null default 0,
  riddles_solved integer not null default 0,
  games_won integer not null default 0,
  best_quiz_score integer not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.member_points TO anon;
GRANT SELECT, UPDATE, DELETE ON public.member_points TO authenticated;
GRANT ALL ON public.member_points TO service_role;
ALTER TABLE public.member_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard is public" ON public.member_points FOR SELECT USING (true);
CREATE POLICY "Admins update points" ON public.member_points FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete points" ON public.member_points FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER member_points_updated BEFORE UPDATE ON public.member_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- POINTS LEDGER (private)
CREATE TABLE public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  points integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.points_ledger TO authenticated;
GRANT ALL ON public.points_ledger TO service_role;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read points ledger" ON public.points_ledger FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

-- BADGES
CREATE TABLE public.member_badges (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  badge text not null,
  earned_at timestamptz not null default now(),
  unique (member_id, badge)
);
GRANT SELECT ON public.member_badges TO anon;
GRANT SELECT, DELETE ON public.member_badges TO authenticated;
GRANT ALL ON public.member_badges TO service_role;
ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges are public" ON public.member_badges FOR SELECT USING (true);
CREATE POLICY "Admins delete badges" ON public.member_badges FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- DAILY CHALLENGE COMPLETIONS
CREATE TABLE public.daily_completions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  date date not null,
  kind text not null,
  created_at timestamptz not null default now(),
  unique (member_id, date)
);
GRANT SELECT ON public.daily_completions TO authenticated;
GRANT ALL ON public.daily_completions TO service_role;
ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read daily completions" ON public.daily_completions FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

-- WHATSAPP CONSENTS
CREATE TABLE public.whatsapp_consents (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references public.members(id) on delete cascade,
  nickname text not null,
  real_name text not null,
  accepted boolean not null default false,
  accepted_at timestamptz,
  join_clicked boolean not null default false,
  joined_at timestamptz,
  device text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, DELETE ON public.whatsapp_consents TO authenticated;
GRANT ALL ON public.whatsapp_consents TO service_role;
ALTER TABLE public.whatsapp_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read consents" ON public.whatsapp_consents FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete consents" ON public.whatsapp_consents FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER whatsapp_consents_updated BEFORE UPDATE ON public.whatsapp_consents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- keep leaderboard identity in sync with member profile
CREATE OR REPLACE FUNCTION public.sync_member_public_data()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  UPDATE public.winners SET winner_name = NEW.nickname, winner_image = NEW.profile_picture, updated_at = now() WHERE member_id = NEW.id;
  UPDATE public.business_posts SET member_nickname = NEW.nickname, member_image = NEW.profile_picture, updated_at = now() WHERE member_id = NEW.id;
  UPDATE public.member_points SET nickname = NEW.nickname, profile_picture = NEW.profile_picture, updated_at = now() WHERE member_id = NEW.id;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.sync_member_public_data() FROM anon, authenticated;

INSERT INTO public.quiz_questions (category, difficulty, question, options, answer_index) VALUES
('Nigeria','easy','What is the capital city of Nigeria?', ARRAY['Lagos','Abuja','Kano','Enugu'],1),
('Nigeria','easy','In what year did Nigeria gain independence?', ARRAY['1957','1960','1963','1970'],1),
('Nigeria','medium','How many states does Nigeria have?', ARRAY['30','34','36','38'],2),
('Nigeria','medium','What is the longest river in Nigeria?', ARRAY['River Benue','River Niger','Cross River','Ogun River'],1),
('Anambra State','easy','What is the capital of Anambra State?', ARRAY['Onitsha','Nnewi','Awka','Ekwulobia'],2),
('Anambra State','medium','Anambra State is located in which geopolitical zone?', ARRAY['South East','South South','North Central','South West'],0),
('Anambra State','medium','Which river gave Anambra State its name?', ARRAY['Omambala River','Ezu River','Idemili River','Mamu River'],0),
('Awka','easy','Awka is historically famous for which craft?', ARRAY['Pottery','Blacksmithing','Weaving','Carving'],1),
('Awka','medium','Which university has its main campus in Awka?', ARRAY['UNN','UNIZIK','ESUT','IMSU'],1),
('General Knowledge','easy','How many continents are there?', ARRAY['5','6','7','8'],2),
('General Knowledge','easy','What colour do you get mixing blue and yellow?', ARRAY['Green','Purple','Orange','Brown'],0),
('General Knowledge','medium','Which is the largest ocean on Earth?', ARRAY['Atlantic','Indian','Arctic','Pacific'],3),
('Science','easy','What gas do plants absorb from the air?', ARRAY['Oxygen','Carbon dioxide','Nitrogen','Hydrogen'],1),
('Science','medium','What is the chemical symbol for gold?', ARRAY['Go','Gd','Au','Ag'],2),
('Science','hard','How many bones are in the adult human body?', ARRAY['186','196','206','216'],2),
('Technology','easy','What does WWW stand for?', ARRAY['World Wide Web','Wide World Web','Web World Wide','World Web Wide'],0),
('Technology','medium','Who co-founded Microsoft with Paul Allen?', ARRAY['Steve Jobs','Bill Gates','Larry Page','Elon Musk'],1),
('Technology','hard','What does HTTP stand for?', ARRAY['HyperText Transfer Protocol','High Transfer Text Protocol','HyperText Transmission Process','Hyper Transfer Text Path'],0),
('Movies','easy','Nigeria''s film industry is popularly called?', ARRAY['Bollywood','Nollywood','Ghollywood','Naijawood'],1),
('Movies','medium','Who directed the movie "Titanic"?', ARRAY['Steven Spielberg','James Cameron','Ridley Scott','Peter Jackson'],1),
('Music','easy','Which Nigerian artist sang "Essence"?', ARRAY['Burna Boy','Davido','Wizkid','Olamide'],2),
('Music','medium','Fela Kuti pioneered which music genre?', ARRAY['Highlife','Afrobeat','Juju','Fuji'],1),
('Sports','easy','How many players are on a football team on the pitch?', ARRAY['9','10','11','12'],2),
('Sports','medium','What is the nickname of Nigeria''s senior football team?', ARRAY['Super Eagles','Black Stars','Elephants','Lions'],0),
('Geography','easy','Which is the largest continent?', ARRAY['Africa','Asia','Europe','America'],1),
('Geography','medium','Mount Kilimanjaro is located in which country?', ARRAY['Kenya','Uganda','Tanzania','Ethiopia'],2),
('History','medium','Who was Nigeria''s first Prime Minister?', ARRAY['Nnamdi Azikiwe','Tafawa Balewa','Obafemi Awolowo','Ahmadu Bello'],1),
('History','hard','In which year did the Nigerian Civil War end?', ARRAY['1967','1969','1970','1972'],2),
('Food','easy','Which Nigerian soup is made with ground melon seeds?', ARRAY['Egusi','Ogbono','Afang','Banga'],0),
('Food','medium','Jollof rice is most associated with which region?', ARRAY['East Africa','West Africa','North Africa','Southern Africa'],1),
('Bible','easy','Who built the ark?', ARRAY['Moses','Noah','Abraham','David'],1),
('Bible','easy','How many books are in the New Testament?', ARRAY['25','26','27','28'],2),
('Bible','medium','Who was thrown into the lions'' den?', ARRAY['Daniel','Joseph','Elijah','Jonah'],0),
('Torah & Judaism','medium','How many books are in the Torah?', ARRAY['3','4','5','6'],2),
('Torah & Judaism','medium','What is the Jewish day of rest called?', ARRAY['Shabbat','Purim','Sukkot','Pesach'],0),
('Mathematics','easy','What is 12 x 12?', ARRAY['124','132','144','154'],2),
('Mathematics','medium','What is 15% of 200?', ARRAY['20','25','30','35'],2),
('Riddles','easy','What has keys but cannot open locks?', ARRAY['A map','A piano','A book','A car'],1),
('Current Affairs','medium','What does AI stand for in technology?', ARRAY['Automatic Input','Artificial Intelligence','Applied Internet','Advanced Interface'],1),
('Logic','medium','If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are?', ARRAY['Lazzies','Not Lazzies','Only Razzies','None'],0),
('Funny Questions','easy','What do you call a boomerang that does not come back?', ARRAY['A stick','A rocket','A frisbee','A ball'],0),
('Funny Questions','easy','Why did the chicken cross the road?', ARRAY['To fly','To get to the other side','To sleep','To dance'],1);

INSERT INTO public.riddles (category, question, answer) VALUES
('Easy','What has hands but cannot clap?','A clock'),
('Easy','What goes up but never comes down?','Your age'),
('Easy','What has a neck but no head?','A bottle'),
('Funny','What has many teeth but cannot bite?','A comb'),
('Funny','What gets wetter the more it dries?','A towel'),
('Tricky','The more you take, the more you leave behind. What am I?','Footsteps'),
('Tricky','What can travel around the world while staying in a corner?','A stamp'),
('IQ','I am tall when young and short when old. What am I?','A candle'),
('IQ','What has cities but no houses, forests but no trees, water but no fish?','A map'),
('Logic','If two is company and three is a crowd, what are four and five?','Nine'),
('Logic','A man has 5 daughters and each has one brother. How many children?','Six'),
('Nigerian','I am worn on Sundays, sewn with pride, and called "agbada" in the West. What am I?','Traditional attire'),
('Nigerian','I am yellow, sweet and roasted by the roadside in Awka. What am I?','Roasted corn'),
('Bible','I was swallowed by a great fish. Who am I?','Jonah'),
('Bible','I turned water into wine at a wedding. Who am I?','Jesus'),
('Kids','What has four legs but cannot walk?','A table'),
('Kids','What is full of holes but still holds water?','A sponge'),
('Adult Friendly','What begins with T, ends with T and has T in it?','A teapot'),
('Adult Friendly','What can you catch but never throw?','A cold');

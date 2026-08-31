
-- helper
create or replace function public.seed_lesson(_sport text, _pos int, _title text, _summary text, _content text, _examples jsonb, _situations jsonb, _level text)
returns uuid language plpgsql set search_path = public as $$
declare _sid uuid; _lid uuid; begin
  select id into _sid from public.sports where slug = _sport;
  insert into public.lessons (sport_id, position, title, summary, content, examples, situations, level, federation, ruleset_version)
  select _sid, _pos, _title, _summary, _content, _examples, _situations, _level, s.federation, s.ruleset_version from public.sports s where s.id = _sid
  returning id into _lid;
  return _lid;
end; $$;
revoke all on function public.seed_lesson(text,int,text,text,text,jsonb,jsonb,text) from public, anon, authenticated;

create or replace function public.seed_q(_lesson uuid, _prompt text, _choices jsonb, _correct int, _expl text, _skill text)
returns void language plpgsql set search_path = public as $$
declare _sid uuid; begin
  select sport_id into _sid from public.lessons where id = _lesson;
  insert into public.questions (sport_id, lesson_id, prompt, choices, correct_index, explanation, skill)
  values (_sid, _lesson, _prompt, _choices, _correct, _expl, _skill);
end; $$;
revoke all on function public.seed_q(uuid,text,jsonb,int,text,text) from public, anon, authenticated;

do $seed$
declare l uuid;
begin
-- ================= FOOTBALL L1 =================
l := public.seed_lesson('football',1,'Les bases : terrain, ballon et coup d''envoi',
 'Dimensions du terrain, durée du match et reprise du jeu au coup d''envoi.',
 E'# Le terrain et le match\n\nUn terrain de football à 11 mesure entre 90 et 120 m de longueur et entre 45 et 90 m de largeur. Pour les matches internationaux : 100 à 110 m sur 64 à 75 m.\n\nLa surface de réparation s''étend à 16,50 m de chaque montant et à 16,50 m à l''intérieur du terrain. Le point de penalty est à 11 m du milieu de la ligne de but.\n\n# Durée\n\nDeux périodes de 45 minutes, avec une mi-temps qui ne dépasse pas 15 minutes. L''arbitre ajoute le temps perdu (arrêts de jeu).\n\n# Coup d''envoi\n\nLe ballon est en jeu dès qu''il est botté et bouge clairement. Le botteur ne peut pas retoucher le ballon avant qu''un autre joueur l''ait touché. Un but peut être marqué directement sur coup d''envoi contre l''équipe adverse.',
 '["Le ballon touche la ligne de touche mais reste partiellement dessus : il est encore en jeu car il faut qu''il franchisse entièrement la ligne.","Un joueur marque directement du coup d''envoi : le but est valable."]'::jsonb,
 '["À la 45e minute, deux remplacements et un soin ont pris 3 minutes : l''arbitre annonce au moins 3 minutes de temps additionnel."]'::jsonb,'debutant');
perform public.seed_q(l,'Quelle est la distance du point de penalty par rapport à la ligne de but ?','["9,15 m","11 m","16,50 m","12 m"]'::jsonb,1,'Le point de penalty est situé à 11 m du milieu de la ligne de but.','regles');
perform public.seed_q(l,'Quand le ballon est-il hors du jeu sur la ligne de touche ?','["Dès qu''il touche la ligne","Quand il franchit entièrement la ligne","Quand l''arbitre siffle","Quand un joueur le réclame"]'::jsonb,1,'Le ballon n''est hors du jeu que lorsqu''il a entièrement franchi la ligne, au sol ou en l''air.','regles');
perform public.seed_q(l,'Un but peut-il être marqué directement sur un coup d''envoi ?','["Non, jamais","Oui, contre l''équipe adverse","Oui, y compris contre son propre camp","Seulement en seconde période"]'::jsonb,1,'Un but direct sur coup d''envoi est valable contre l''adversaire ; dans son propre but, c''est un corner pour l''adversaire.','regles');
perform public.seed_q(l,'Durée réglementaire d''un match senior à 11 ?','["2 x 40 minutes","2 x 45 minutes","2 x 50 minutes","4 x 25 minutes"]'::jsonb,1,'Deux périodes de 45 minutes, plus le temps additionnel décidé par l''arbitre.','regles');
perform public.seed_q(l,'Le botteur du coup d''envoi touche à nouveau le ballon avant tout autre joueur. Décision ?','["Jeu continue","Coup franc indirect pour l''adversaire","Penalty","Carton jaune"]'::jsonb,1,'Retoucher le ballon avant un autre joueur est sanctionné par un coup franc indirect (ou direct/penalty en cas de main volontaire).','decision');
perform public.seed_q(l,'La mi-temps ne doit pas dépasser :','["10 minutes","15 minutes","20 minutes","5 minutes"]'::jsonb,1,'La pause de mi-temps ne dépasse pas 15 minutes.','regles');
perform public.seed_q(l,'Largeur de la surface de réparation depuis chaque montant ?','["11 m","16,50 m","5,50 m","9,15 m"]'::jsonb,1,'La surface de réparation part de 16,50 m de chaque montant et s''enfonce de 16,50 m dans le terrain.','regles');
perform public.seed_q(l,'Distance minimale des adversaires sur un coup franc ?','["5 m","9,15 m","11 m","6 m"]'::jsonb,1,'Les adversaires doivent se tenir à au moins 9,15 m du ballon.','regles');
perform public.seed_q(l,'Le ballon rebondit sur l''arbitre et entre dans le but. Décision ?','["But valable","Balle à terre","Coup franc","Corner"]'::jsonb,1,'Si le ballon touche l''arbitre et qu''un but est marqué (ou que la possession change), on reprend par une balle à terre.','decision');
perform public.seed_q(l,'Qui décide de la durée du temps additionnel ?','["Le quatrième arbitre","L''arbitre central","Le délégué","Les capitaines"]'::jsonb,1,'L''arbitre central est seul juge du temps perdu ; le quatrième arbitre l''affiche seulement.','regles');
perform public.seed_q(l,'Les dimensions d''un terrain pour match international sont :','["90-120 m x 45-90 m","100-110 m x 64-75 m","105 m x 68 m obligatoirement","120 m x 90 m"]'::jsonb,1,'Pour les matches internationaux : longueur 100-110 m, largeur 64-75 m.','regles');
perform public.seed_q(l,'Au coup d''envoi, où doivent se trouver les adversaires du botteur ?','["Dans leur moitié de terrain, à 9,15 m du ballon","N''importe où","Sur la ligne médiane","Dans la surface"]'::jsonb,0,'Tous les joueurs sont dans leur moitié de terrain et les adversaires à au moins 9,15 m du ballon.','regles');

-- ================= FOOTBALL L2 =================
l := public.seed_lesson('football',2,'Fautes, sanctions et cartons',
 'Coup franc direct ou indirect, penalty, avertissement et exclusion.',
 E'# Coup franc direct\n\nUn coup franc direct est accordé pour les fautes commises avec imprudence, témérité ou force excessive : charger, sauter sur, donner un coup de pied, pousser, frapper, tacler, faire trébucher, ou toucher le ballon de la main volontairement.\n\nSi la faute est commise par un défenseur dans sa propre surface de réparation : penalty.\n\n# Coup franc indirect\n\nJeu dangereux, obstruction sans contact, empêcher le gardien de lâcher le ballon, hors-jeu, gardien tenant le ballon plus de 8 secondes ou reprenant le ballon des mains sur une passe volontaire du pied d''un partenaire.\n\n# Cartons\n\nJaune (avertissement) : comportement antisportif, contestation, retard à la reprise, non-respect de la distance, entrée/sortie sans permission.\n\nRouge (exclusion) : faute grossière, comportement violent, crachat, main volontaire annihilant un but, annihilation d''une occasion de but manifeste, propos injurieux, deuxième avertissement.',
 '["Un tacle par derrière avec force excessive : coup franc direct + carton rouge.","Le dernier défenseur retient un attaquant lancé au but hors surface : rouge pour annihilation d''occasion de but manifeste."]'::jsonb,
 '["Un défenseur commet une faute imprudente dans sa surface sur un joueur qui n''allait pas au but : penalty et pas de carton."]'::jsonb,'debutant');
perform public.seed_q(l,'Une faute imprudente d''un défenseur dans sa surface donne :','["Coup franc indirect","Penalty","Coup franc direct sur la ligne","Rien"]'::jsonb,1,'Toute faute passible d''un coup franc direct commise par un défenseur dans sa surface est sanctionnée d''un penalty.','decision');
perform public.seed_q(l,'Le hors-jeu est sanctionné par :','["Coup franc direct","Coup franc indirect","Penalty","Balle à terre"]'::jsonb,1,'Le hors-jeu est sanctionné par un coup franc indirect à l''endroit de l''infraction.','regles');
perform public.seed_q(l,'Combien de secondes le gardien peut-il contrôler le ballon des mains ?','["4","6","8","10"]'::jsonb,2,'Depuis 2019/25 la limite est de 8 secondes, sanctionnée par un corner pour l''adversaire.','regles');
perform public.seed_q(l,'Un joueur enlève son maillot après un but. Décision ?','["Rien","Avertissement","Exclusion","Coup franc"]'::jsonb,1,'Enlever son maillot lors d''une célébration est un comportement antisportif : carton jaune.','decision');
perform public.seed_q(l,'Une faute avec force excessive entraîne :','["Jaune","Rouge","Rien","Coup franc simple"]'::jsonb,1,'L''usage de la force excessive met en danger l''adversaire : exclusion.','decision');
perform public.seed_q(l,'Un défenseur touche le ballon de la main et empêche un but. Décision ?','["Penalty seul","Penalty + rouge","Penalty + jaune","Coup franc indirect"]'::jsonb,1,'Empêcher un but de la main : penalty et carton rouge.','decision');
perform public.seed_q(l,'Un joueur conteste bruyamment une décision. Sanction ?','["Rien","Avertissement","Exclusion","Coup franc indirect"]'::jsonb,1,'La contestation en paroles ou en actes est passible d''un avertissement.','decision');
perform public.seed_q(l,'Un attaquant est retenu dans la surface alors qu''il tentait de jouer le ballon. Décision ?','["Coup franc indirect","Penalty + jaune si occasion réelle","Rien","Rouge systématique"]'::jsonb,1,'Retenir un adversaire est une faute de coup franc direct ; dans la surface, penalty, avec jaune si une occasion prometteuse est stoppée.','decision');
perform public.seed_q(l,'Le gardien reprend le ballon des mains sur une passe du pied d''un partenaire :','["Coup franc direct","Coup franc indirect","Penalty","Rien"]'::jsonb,1,'C''est une faute technique sanctionnée par un coup franc indirect à l''endroit de la faute.','regles');
perform public.seed_q(l,'Deux avertissements dans le même match entraînent :','["Rien de plus","Exclusion","Une suspension immédiate de 10 minutes","Un penalty"]'::jsonb,1,'Le second avertissement entraîne un carton rouge et l''exclusion.','regles');
perform public.seed_q(l,'Le jeu dangereux sans contact est sanctionné par :','["Coup franc direct","Coup franc indirect","Penalty","Balle à terre"]'::jsonb,1,'Sans contact, le jeu dangereux donne un coup franc indirect.','regles');
perform public.seed_q(l,'Quand l''arbitre applique-t-il l''avantage ?','["Toujours","Quand l''équipe fautive en profite","Quand l''équipe victime garde une action prometteuse","Jamais sur faute"]'::jsonb,2,'L''avantage se laisse quand l''équipe victime conserve une action prometteuse ; sinon on revient à la faute.','decision');

-- ================= FOOTBALL L3 =================
l := public.seed_lesson('football',3,'Le hors-jeu',
 'Position, participation active et exceptions.',
 E'# Position de hors-jeu\n\nUn joueur est en position de hors-jeu si une partie de sa tête, de son corps ou de ses pieds se trouve dans la moitié de terrain adverse ET plus près de la ligne de but adverse que le ballon ET que l''avant-dernier adversaire. Les bras et les mains ne comptent pas.\n\nÊtre en position de hors-jeu n''est pas une infraction en soi.\n\n# Infraction\n\nIl y a infraction lorsqu''au moment où le ballon est joué par un partenaire, le joueur en position de hors-jeu participe activement :\n- en intervenant dans le jeu,\n- en interférant avec un adversaire,\n- en tirant un avantage de sa position.\n\n# Exceptions\n\nPas de hors-jeu sur une rentrée de touche, un coup de pied de but ou un corner. Le joueur n''est pas non plus en infraction s''il reçoit le ballon directement d''un dégagement délibéré d''un adversaire (hors parade du gardien).',
 '["Un attaquant en position de hors-jeu ne touche pas le ballon et ne gêne personne : le jeu continue."]'::jsonb,
 '["Sur corner, un attaquant se trouve derrière tous les défenseurs et marque : le but est valable, pas de hors-jeu sur corner."]'::jsonb,'amateur');
perform public.seed_q(l,'Y a-t-il hors-jeu sur une rentrée de touche ?','["Oui","Non","Seulement dans la surface","Uniquement en seconde période"]'::jsonb,1,'Il n''y a jamais hors-jeu directement sur une rentrée de touche.','regles');
perform public.seed_q(l,'Quelles parties du corps ne comptent pas pour juger le hors-jeu ?','["Les pieds","La tête","Les bras et les mains","Le torse"]'::jsonb,2,'Les bras et les mains jusqu''à l''aisselle ne sont pas pris en compte.','regles');
perform public.seed_q(l,'Un joueur en position de hors-jeu qui ne participe pas au jeu :','["Est sanctionné","N''est pas sanctionné","Reçoit un jaune","Doit sortir"]'::jsonb,1,'La position seule n''est pas une infraction : il faut une participation active.','regles');
perform public.seed_q(l,'Le hors-jeu s''apprécie au moment :','["Où le joueur reçoit le ballon","Où le ballon est joué par un partenaire","Du coup de sifflet","De la frappe au but"]'::jsonb,1,'On juge la position au moment où le ballon est joué ou touché par un partenaire.','regles');
perform public.seed_q(l,'Hors-jeu possible sur un coup de pied de but ?','["Oui","Non","Seulement hors surface","Selon le niveau"]'::jsonb,1,'Aucun hors-jeu ne peut être sanctionné directement sur un coup de pied de but.','regles');
perform public.seed_q(l,'Un attaquant hors-jeu récupère le ballon après une parade du gardien :','["Pas de hors-jeu","Hors-jeu sanctionné","Penalty","Balle à terre"]'::jsonb,1,'Une parade n''est pas un dégagement délibéré : le hors-jeu est sanctionné.','decision');
perform public.seed_q(l,'Un attaquant hors-jeu reçoit le ballon d''une passe volontaire d''un défenseur :','["Hors-jeu","Pas de hors-jeu","Coup franc indirect","Balle à terre"]'::jsonb,1,'Le dégagement délibéré d''un adversaire remet le joueur en jeu.','decision');
perform public.seed_q(l,'Un joueur est-il hors-jeu dans sa propre moitié de terrain ?','["Oui","Non","Selon la position du ballon","Selon l''arbitre"]'::jsonb,1,'Il faut être dans la moitié adverse pour être en position de hors-jeu.','regles');
perform public.seed_q(l,'La sanction d''un hors-jeu est :','["Coup franc direct","Coup franc indirect à l''endroit de l''infraction","Balle à terre","Coup de pied de but"]'::jsonb,1,'Coup franc indirect à l''endroit où se trouvait le joueur au moment de l''infraction.','regles');
perform public.seed_q(l,'Qui signale généralement le hors-jeu ?','["Le quatrième arbitre","L''arbitre assistant","Le capitaine","Le délégué"]'::jsonb,1,'L''arbitre assistant lève son drapeau, puis indique la zone du terrain.','gestes');
perform public.seed_q(l,'Un attaquant hors-jeu gêne la vue du gardien sans toucher le ballon :','["Rien","Hors-jeu sanctionné","Coup franc direct","Jaune"]'::jsonb,1,'Interférer avec un adversaire, notamment gêner sa ligne de vue, constitue une infraction.','decision');
perform public.seed_q(l,'Y a-t-il hors-jeu sur corner ?','["Oui","Non","Seulement si le ballon revient","Selon la compétition"]'::jsonb,1,'Aucun hors-jeu directement sur un corner.','regles');

-- ================= BASKETBALL L1 =================
l := public.seed_lesson('basketball',1,'Chronomètres et règles de temps',
 '24 secondes, 8 secondes, 5 secondes et 3 secondes.',
 E'# Les règles de temps FIBA\n\n- **24 secondes** : durée maximale d''une possession pour tenter un tir. Le chronomètre est remis à 14 secondes après un rebond offensif.\n- **8 secondes** : l''équipe qui contrôle le ballon dans sa zone arrière doit l''amener en zone avant en 8 secondes.\n- **5 secondes** : un joueur étroitement marqué doit passer, tirer ou dribbler dans les 5 secondes ; une remise en jeu doit être effectuée en 5 secondes.\n- **3 secondes** : un attaquant ne peut rester plus de 3 secondes consécutives dans la raquette adverse pendant que son équipe contrôle le ballon en zone avant.\n\nUn match FIBA se joue en 4 périodes de 10 minutes.',
 '["Rebond offensif après un tir ayant touché l''anneau : le chrono repart à 14 secondes."]'::jsonb,
 '["Un attaquant est dans la raquette depuis 3 secondes mais son équipe vient de perdre le contrôle du ballon : la règle ne s''applique plus."]'::jsonb,'debutant');
perform public.seed_q(l,'Durée d''une possession en FIBA ?','["30 secondes","24 secondes","35 secondes","20 secondes"]'::jsonb,1,'La possession est limitée à 24 secondes.','regles');
perform public.seed_q(l,'Après un rebond offensif, le chronomètre est remis à :','["24 s","14 s","12 s","8 s"]'::jsonb,1,'Remise à 14 secondes après rebond offensif sur un tir ayant touché l''anneau.','regles');
perform public.seed_q(l,'Temps pour franchir la ligne médiane ?','["5 s","8 s","10 s","6 s"]'::jsonb,1,'8 secondes pour passer de la zone arrière à la zone avant.','regles');
perform public.seed_q(l,'Durée maximale dans la raquette adverse ?','["2 s","3 s","4 s","5 s"]'::jsonb,1,'La règle des 3 secondes s''applique en zone restrictive adverse.','regles');
perform public.seed_q(l,'Temps pour effectuer une remise en jeu ?','["3 s","5 s","8 s","10 s"]'::jsonb,1,'La remise en jeu doit être effectuée dans les 5 secondes.','regles');
perform public.seed_q(l,'Un match FIBA se joue en :','["4 x 12 min","4 x 10 min","2 x 20 min","3 x 15 min"]'::jsonb,1,'Quatre périodes de 10 minutes en FIBA.','regles');
perform public.seed_q(l,'Violation des 24 secondes : reprise du jeu ?','["Lancers francs","Remise en jeu pour l''adversaire","Entre-deux","Rien"]'::jsonb,1,'Le ballon est remis à l''adversaire pour une remise en jeu.','decision');
perform public.seed_q(l,'Le joueur étroitement marqué dispose de :','["3 s","5 s","8 s","10 s"]'::jsonb,1,'5 secondes pour passer, tirer ou dribbler.','regles');
perform public.seed_q(l,'Le retour en zone est :','["Autorisé","Une violation","Une faute technique","Sans conséquence"]'::jsonb,1,'Ramener le ballon en zone arrière après l''avoir établi en zone avant est une violation.','regles');
perform public.seed_q(l,'Prolongation en cas d''égalité :','["3 minutes","5 minutes","10 minutes","But en or"]'::jsonb,1,'Les prolongations durent 5 minutes.','regles');
perform public.seed_q(l,'Le chronomètre des tirs repart à 24 s quand :','["Rebond offensif","Nouvelle possession adverse","Sortie de balle offensive","Temps mort offensif en zone avant"]'::jsonb,1,'Une nouvelle possession adverse remet le chrono à 24 secondes.','regles');
perform public.seed_q(l,'La règle des 3 secondes s''applique :','["Toujours","Quand l''équipe contrôle le ballon en zone avant","En défense aussi","Uniquement sur lancers francs"]'::jsonb,1,'Elle ne s''applique que pendant le contrôle du ballon en zone avant par l''équipe attaquante.','regles');

-- ================= BASKETBALL L2 =================
l := public.seed_lesson('basketball',2,'Fautes personnelles et lancers francs',
 'Contact illégal, faute en action de tir, bonus d''équipe.',
 E'# Fautes personnelles\n\nUne faute personnelle est un contact illégal avec un adversaire. Le principe fondamental est celui du **cylindre** et de la **position légale de défense** : le défenseur doit avoir les deux pieds au sol et faire face à l''adversaire.\n\n# Lancers francs\n\n- Faute sur un tireur à 2 points réussi : 1 lancer franc.\n- Faute sur un tireur à 2 points manqué : 2 lancers francs.\n- Faute sur un tireur à 3 points manqué : 3 lancers francs.\n- À partir de la 5e faute d''équipe dans la période : 2 lancers francs pour toute faute de défense.\n\nUn joueur est exclu après 5 fautes personnelles. La faute technique sanctionne un comportement antisportif sans contact ; la faute antisportive un contact non justifié par une action normale de jeu.',
 '["Faute lors d''un tir à 3 points réussi : le panier compte et 1 lancer franc supplémentaire."]'::jsonb,
 '["4e faute d''équipe, faute en défense sans tir : simple remise en jeu, pas de lancers francs."]'::jsonb,'amateur');
perform public.seed_q(l,'Nombre de fautes personnelles avant exclusion ?','["4","5","6","7"]'::jsonb,1,'Cinq fautes personnelles entraînent la sortie définitive du joueur.','regles');
perform public.seed_q(l,'Faute sur un tir à 3 points manqué :','["1 LF","2 LF","3 LF","Remise en jeu"]'::jsonb,2,'Trois lancers francs sont accordés.','decision');
perform public.seed_q(l,'Faute sur un tir à 2 points réussi :','["Panier annulé","Panier + 1 LF","2 LF","Rien"]'::jsonb,1,'Le panier compte et le tireur obtient un lancer franc supplémentaire.','decision');
perform public.seed_q(l,'À partir de quelle faute d''équipe accorde-t-on 2 LF ?','["3e","4e","5e","6e"]'::jsonb,2,'À partir de la 5e faute d''équipe dans la période.','regles');
perform public.seed_q(l,'Une faute technique sanctionne :','["Un contact violent","Un comportement antisportif sans contact","Un marcher","Une sortie de balle"]'::jsonb,1,'La faute technique concerne le comportement, sans contact avec un adversaire.','regles');
perform public.seed_q(l,'La position légale de défense exige :','["Les bras levés","Les deux pieds au sol face à l''adversaire","Un pied dans la raquette","D''être immobile 3 secondes"]'::jsonb,1,'Le défenseur doit faire face à l''adversaire avec les deux pieds au sol.','regles');
perform public.seed_q(l,'Une faute antisportive donne :','["Rien","LF + possession","Seulement LF","Exclusion directe"]'::jsonb,1,'Lancers francs puis remise en jeu à hauteur de la ligne médiane pour l''équipe victime.','decision');
perform public.seed_q(l,'Deux fautes antisportives pour un même joueur :','["Rien de plus","Disqualification","Faute technique","Suspension 5 min"]'::jsonb,1,'Deux fautes antisportives entraînent la disqualification.','regles');
perform public.seed_q(l,'Faute offensive (charge) :','["LF pour l''attaque","Ballon à la défense","2 LF","Entre-deux"]'::jsonb,1,'Aucun lancer franc : le ballon revient à l''équipe qui défendait.','decision');
perform public.seed_q(l,'Le cylindre désigne :','["La raquette","L''espace vertical occupé par un joueur","Le cercle central","La zone à 3 points"]'::jsonb,1,'Chaque joueur a droit à l''espace vertical qu''il occupe au sol.','regles');
perform public.seed_q(l,'Faute avant la remise en jeu, en bonus :','["Remise en jeu","2 LF","1 LF","Entre-deux"]'::jsonb,1,'En situation de bonus, toute faute de défense donne 2 lancers francs.','decision');
perform public.seed_q(l,'Un joueur simule une faute :','["Rien","Avertissement puis faute technique","Faute antisportive directe","Disqualification"]'::jsonb,1,'La simulation entraîne un avertissement, puis une faute technique en cas de récidive.','decision');

-- ================= VOLLEYBALL L1 =================
l := public.seed_lesson('volleyball',1,'Points, rotations et fautes de filet',
 'Système de points, ordre de rotation, touches et contacts au filet.',
 E'# Le score\n\nUn set se joue en 25 points avec 2 points d''écart ; le 5e set (tie-break) se joue en 15 points avec 2 points d''écart. Le match se joue au meilleur des 5 sets.\n\n# Rotation\n\nÀ chaque fois qu''une équipe reprend le service à l''adversaire, elle effectue une rotation dans le sens des aiguilles d''une montre. Une faute de position au moment de la frappe de service donne le point à l''adversaire.\n\n# Touches et filet\n\nTrois touches maximum par équipe (le contre ne compte pas). Un joueur ne peut pas toucher deux fois de suite le ballon, sauf après un contre.\n\nToucher le filet entre les antennes pendant l''action de jouer le ballon est une faute. Franchir la ligne centrale complètement avec un pied est une faute.',
 '["Le contre touche le ballon : l''équipe conserve trois touches ensuite."]'::jsonb,
 '["Un joueur touche le filet hors des antennes sans gêner : ce n''est pas une faute."]'::jsonb,'debutant');
perform public.seed_q(l,'Un set se joue en :','["21 points","25 points","30 points","15 points"]'::jsonb,1,'25 points avec 2 points d''écart (sauf tie-break).','regles');
perform public.seed_q(l,'Le tie-break se joue en :','["15 points","21 points","25 points","11 points"]'::jsonb,0,'Le 5e set se joue en 15 points avec 2 d''écart.','regles');
perform public.seed_q(l,'Nombre de touches par équipe (hors contre) :','["2","3","4","Illimité"]'::jsonb,1,'Trois touches maximum pour renvoyer le ballon.','regles');
perform public.seed_q(l,'Le contre compte-t-il comme une touche ?','["Oui","Non","Seulement en tie-break","Selon l''arbitre"]'::jsonb,1,'Le contact au contre ne compte pas dans les trois touches.','regles');
perform public.seed_q(l,'Toucher le filet pendant l''action de jouer le ballon :','["Autorisé","Faute","Avertissement","Point à rejouer"]'::jsonb,1,'C''est une faute, point pour l''adversaire.','decision');
perform public.seed_q(l,'Le sens de rotation est :','["Antihoraire","Horaire","Libre","Décidé par le capitaine"]'::jsonb,1,'La rotation se fait dans le sens des aiguilles d''une montre.','regles');
perform public.seed_q(l,'Le libéro peut-il servir en FIVB ?','["Oui toujours","Non","Seulement au tie-break","Une fois par set"]'::jsonb,1,'Le libéro ne peut pas servir dans les règles FIVB internationales.','regles');
perform public.seed_q(l,'Franchir complètement la ligne centrale avec un pied :','["Autorisé","Faute","Autorisé si pas de gêne","Avertissement"]'::jsonb,1,'Le pied doit garder un contact partiel avec la ligne centrale.','regles');
perform public.seed_q(l,'Faute de position au service :','["Point pour l''adversaire","Service à refaire","Avertissement","Rien"]'::jsonb,0,'La faute de position donne le point et le service à l''adversaire.','decision');
perform public.seed_q(l,'Le match se joue au meilleur des :','["3 sets","5 sets","7 sets","4 sets"]'::jsonb,1,'Au meilleur des 5 sets.','regles');
perform public.seed_q(l,'Un joueur touche deux fois de suite le ballon (hors contre) :','["Autorisé","Faute de double touche","Rejeu","Avertissement"]'::jsonb,1,'Double touche : faute, sauf après un contre.','regles');
perform public.seed_q(l,'Le ballon touche la ligne du terrain :','["Faute","Balle bonne","Rejeu","Décision des juges de ligne uniquement"]'::jsonb,1,'Une balle touchant la ligne est bonne.','regles');
end $seed$;

-- Seed data for ssor_kb
-- Excludes 65(1), 65(2), 70(2) to align with migration 002 simplifications

INSERT INTO public.ssor_kb (act_name, section_code, tier, severity_rank, description) VALUES
    -- RED -- dangerous predator / gang offender
    ('BNS', '63', 'RED', 100, 'Rape - definition'),
    ('BNS', '64', 'RED', 100, 'Rape - punishment'),
    ('BNS', '65', 'RED', 100, 'Rape of a girl under 16/12 (sub-clauses (1)/(2))'),
    ('BNS', '66', 'RED', 100, 'Rape causing death or persistent vegetative state'),
    ('BNS', '70', 'RED', 100, 'Gang rape'),
    ('POCSO', '5', 'RED', 100, 'Aggravated penetrative sexual assault'),
    ('POCSO', '6', 'RED', 100, 'Aggravated penetrative sexual assault - punishment'),

    -- ORANGE -- repeat / habitual offender
    ('BNS', '71', 'ORANGE', 80, 'Repeat/habitual sexual offender'),

    -- BLACK -- organised crime / trafficking
    ('BNS', '111', 'BLACK', 90, 'Organised crime'),
    ('BNS', '143', 'BLACK', 90, 'Trafficking of persons'),
    ('BNS', '144', 'BLACK', 90, 'Exploitation of a trafficked person'),
    ('ITPA', '3', 'BLACK', 90, 'Keeping a brothel'),
    ('ITPA', '4', 'BLACK', 90, 'Living on earnings of prostitution'),
    ('ITPA', '5', 'BLACK', 90, 'Procuring / inducing person for prostitution'),
    ('ITPA', '6', 'BLACK', 90, 'Detention of a person in premises where prostitution is carried on'),
    ('ITPA', '7', 'BLACK', 90, 'Prostitution in or near public places'),

    -- BLUE -- cyber sexual offender
    ('IT_ACT', '66E', 'BLUE', 60, 'Capturing/transmitting image of private area without consent'),
    ('IT_ACT', '67', 'BLUE', 60, 'Publishing obscene material in electronic form'),
    ('IT_ACT', '67A', 'BLUE', 60, 'Publishing sexually explicit material'),
    ('IT_ACT', '67B', 'BLUE', 60, 'Child sexual abuse material'),
    ('BNS', '77', 'BLUE', 60, 'Voyeurism'),
    ('POCSO', '11', 'BLUE', 60, 'Sexual harassment of a child'),
    ('POCSO', '12', 'BLUE', 60, 'Punishment for sexual harassment of a child'),
    ('POCSO', '13', 'BLUE', 60, 'Use of child for pornographic purposes'),
    ('POCSO', '14', 'BLUE', 60, 'Punishment for pornographic purposes involving a child'),

    -- PINK -- non-contact / harassment offender
    ('BNS', '74', 'PINK', 40, 'Assault/criminal force to woman with intent to outrage modesty'),
    ('BNS', '75', 'PINK', 40, 'Sexual harassment'),
    ('BNS', '76', 'PINK', 40, 'Assault with intent to disrobe'),
    ('BNS', '78', 'PINK', 40, 'Stalking'),
    ('BNS', '79', 'PINK', 40, 'Insult to modesty of a woman')
ON CONFLICT (act_name, section_code) DO NOTHING;

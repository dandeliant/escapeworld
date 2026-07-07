/* ═══════════ EscapeWorld — domyślna kampania (dane startowe) ═══════════
   Struktura wielojęzyczna: treści dla gracza w EN/FR/DE/RU + tłumaczenie PL.
   content.* to tablice zdań — wyrównane indeksami, dzięki czemu każde zdanie
   ma swoje tłumaczenie (klik w zdanie → menu: wymowa / tłumaczenie / nauka). */
window.EW = window.EW || {};

EW.DEFAULT_CAMPAIGN = {
  meta: {
    name: 'Inwazja: Pierwszy sygnał',
    author: 'EscapeWorld',
    version: 1,
    center: { lat: 52.2297, lng: 21.0122 },
  },

  chapters: [
    { id: 1, title: 'Pierwszy sygnał', desc: 'Gracz znajduje pierwszy nadajnik i pamiętnik ocalałego.' },
    { id: 2, title: 'Kod w języku', desc: 'Gracz odkrywa, że obcy kontrolują ludzi przez językowe struktury.' },
    { id: 3, title: 'Energia Lingwistyczna', desc: 'Gracz uczy się, że poprawnie wypowiadane zdania tworzą energię.' },
    { id: 4, title: 'Baza pod miastem', desc: 'Gracz odkrywa pierwszą bazę obcych.' },
    { id: 5, title: 'Portal', desc: 'Gracz aktywuje portal i przechodzi do nowego regionu.' },
  ],

  points: [
    /* ── BEZPIECZNA STREFA (start) ── */
    {
      id: 'sz-hideout', type: 'safezone', chapter: 1,
      name: 'Kryjówka ocalałych',
      lat: 52.2297, lng: 21.0122, radius: 60, maxSpeed: 30,
      descriptionPl: 'Punkt startowy. Tu gracz odpoczywa, zapisuje postęp i odbiera nowe wytyczne po nieudanej misji.',
      content: {
        en: ['Welcome to the hideout.', 'Here you are safe from the creatures.', 'Rest, review your notes and pick up new instructions.'],
        fr: ['Bienvenue dans la cachette.', 'Ici, tu es à l’abri des créatures.', 'Repose-toi, révise tes notes et prends de nouvelles instructions.'],
        de: ['Willkommen im Versteck.', 'Hier bist du vor den Wesen sicher.', 'Ruh dich aus, wiederhole deine Notizen und hol dir neue Anweisungen.'],
        ru: ['Добро пожаловать в убежище.', 'Здесь ты в безопасности от существ.', 'Отдохни, повтори записи и получи новые указания.'],
        pl: ['Witaj w kryjówce.', 'Tutaj jesteś bezpieczny przed istotami.', 'Odpocznij, powtórz notatki i odbierz nowe wytyczne.'],
      },
      questions: [],
      rewards: { coins: 0, energy: 0, xp: 0 },
    },

    /* ── NADAJNIK ── */
    {
      id: 'm-transmitter', type: 'transmitter', chapter: 1,
      name: 'Stary nadajnik',
      lat: 52.2325, lng: 21.0155, radius: 50, maxSpeed: 30,
      descriptionPl: 'Pierwsza misja fabularna. Aktywacja nadajnika odsłania ukryte punkty na mapie.',
      unlocks: ['d-scientist', 'a-lingua-core'],
      vanishOnFail: true, relocateOnFail: true,
      penalty: { hp: 10, coins: 20 },
      content: {
        en: ['The transmitter hums quietly.', 'A code appears on the cracked screen.', 'Only a correct answer will activate the antenna.'],
        fr: ['L’émetteur bourdonne doucement.', 'Un code apparaît sur l’écran fissuré.', 'Seule une bonne réponse activera l’antenne.'],
        de: ['Der Sender summt leise.', 'Auf dem gesprungenen Bildschirm erscheint ein Code.', 'Nur eine richtige Antwort aktiviert die Antenne.'],
        ru: ['Передатчик тихо гудит.', 'На треснувшем экране появляется код.', 'Только правильный ответ включит антенну.'],
        pl: ['Nadajnik cicho buczy.', 'Na pękniętym ekranie pojawia się kod.', 'Tylko poprawna odpowiedź uruchomi antenę.'],
      },
      questions: [
        {
          type: 'input',
          prompt: { en: 'Translate into the language you are learning: „antena”', fr: 'Traduis dans la langue apprise : « antena »', de: 'Übersetze in die Lernsprache: „antena”', ru: 'Переведи на изучаемый язык: «antena»' },
          answer: { en: 'antenna', fr: 'antenne', de: 'antenne', ru: 'антенна' },
        },
        {
          type: 'choice',
          prompt: { en: 'Where does the code appear?', fr: 'Où apparaît le code ?', de: 'Wo erscheint der Code?', ru: 'Где появляется код?' },
          options: {
            en: ['On the cracked screen', 'On the wall', 'In the sky'],
            fr: ['Sur l’écran fissuré', 'Sur le mur', 'Dans le ciel'],
            de: ['Auf dem gesprungenen Bildschirm', 'An der Wand', 'Am Himmel'],
            ru: ['На треснувшем экране', 'На стене', 'В небе'],
          },
          correct: 0,
        },
        {
          type: 'truefalse',
          prompt: { en: 'The transmitter is completely silent.', fr: 'L’émetteur est complètement silencieux.', de: 'Der Sender ist völlig still.', ru: 'Передатчик совершенно бесшумный.' },
          correct: false,
        },
      ],
      rewards: {
        coins: 150, energy: 30, xp: 40,
        words: [{ target: { en: 'transmitter', fr: 'émetteur', de: 'Sender', ru: 'передатчик' }, pl: 'nadajnik' }],
        story: { title: 'Sygnał odebrany', textPl: 'Antena ożywa. Na mapie pojawiają się nowe sygnatury: ktoś jeszcze żyje w tym mieście… i zostawił Ci wiadomość.' },
      },
    },

    /* ── PAMIĘTNIK 1 ── */
    {
      id: 'd-diary-ewa', type: 'diary', chapter: 1,
      name: 'Pamiętnik Ewy',
      lat: 52.2310, lng: 21.0075, radius: 50, maxSpeed: 30,
      descriptionPl: 'Pierwszy pamiętnik ocalałej. Wprowadza mechanikę czytania i pytania sprawdzające rozumienie.',
      vanishOnFail: true, relocateOnFail: true,
      penalty: { hp: 10, coins: 20 },
      content: {
        en: ['Day 12. The creatures listen to every word we say.', 'They grow weaker when we speak languages they cannot decode.', 'If you find this diary, learn as many words as you can.'],
        fr: ['Jour 12. Les créatures écoutent chaque mot que nous disons.', 'Elles s’affaiblissent quand nous parlons des langues qu’elles ne peuvent pas décoder.', 'Si tu trouves ce journal, apprends autant de mots que possible.'],
        de: ['Tag 12. Die Wesen hören jedes Wort, das wir sagen.', 'Sie werden schwächer, wenn wir Sprachen sprechen, die sie nicht entschlüsseln können.', 'Wenn du dieses Tagebuch findest, lerne so viele Wörter wie möglich.'],
        ru: ['День 12. Существа слушают каждое наше слово.', 'Они слабеют, когда мы говорим на языках, которые они не могут расшифровать.', 'Если ты найдёшь этот дневник, выучи как можно больше слов.'],
        pl: ['Dzień 12. Istoty słuchają każdego słowa, które wypowiadamy.', 'Słabną, gdy mówimy w językach, których nie potrafią rozszyfrować.', 'Jeśli znajdziesz ten pamiętnik, naucz się jak najwięcej słów.'],
      },
      questions: [
        {
          type: 'choice',
          prompt: { en: 'What do the creatures do?', fr: 'Que font les créatures ?', de: 'Was tun die Wesen?', ru: 'Что делают существа?' },
          options: {
            en: ['They listen to every word', 'They sleep all day', 'They hide underground'],
            fr: ['Elles écoutent chaque mot', 'Elles dorment toute la journée', 'Elles se cachent sous terre'],
            de: ['Sie hören jedes Wort', 'Sie schlafen den ganzen Tag', 'Sie verstecken sich unter der Erde'],
            ru: ['Слушают каждое слово', 'Спят весь день', 'Прячутся под землёй'],
          },
          correct: 0,
        },
        {
          type: 'truefalse',
          prompt: { en: 'The creatures grow weaker when people speak languages they cannot decode.', fr: 'Les créatures s’affaiblissent quand les gens parlent des langues qu’elles ne peuvent pas décoder.', de: 'Die Wesen werden schwächer, wenn Menschen Sprachen sprechen, die sie nicht entschlüsseln können.', ru: 'Существа слабеют, когда люди говорят на языках, которые они не могут расшифровать.' },
          correct: true,
        },
        {
          type: 'input',
          prompt: { en: 'Translate into the language you are learning: „słowo”', fr: 'Traduis dans la langue apprise : « słowo »', de: 'Übersetze in die Lernsprache: „słowo”', ru: 'Переведи на изучаемый язык: «słowo»' },
          answer: { en: 'word', fr: 'mot', de: 'wort', ru: 'слово' },
        },
      ],
      rewards: {
        coins: 150, energy: 40, xp: 50,
        words: [{ target: { en: 'word', fr: 'mot', de: 'Wort', ru: 'слово' }, pl: 'słowo' }],
        story: { title: 'Zapiski Ewy', textPl: 'Ewa przeżyła pierwsze tygodnie inwazji. Jej pamiętnik potwierdza: język jest bronią. Obcy nie rozumieją tego, czego sami się nie nauczyli.' },
      },
    },

    /* ── SZYFR JĘZYKOWY ── */
    {
      id: 'm-cipher', type: 'mission', chapter: 1,
      name: 'Zaszyfrowana wiadomość',
      lat: 52.2275, lng: 21.0170, radius: 50, maxSpeed: 30,
      descriptionPl: 'Szyfr obcych — zadanie słownikowe. Zła odpowiedź = trop znika i pojawia się gdzie indziej.',
      vanishOnFail: true, relocateOnFail: true,
      penalty: { hp: 15, coins: 30 },
      content: {
        en: ['You find a metal plate covered in alien symbols.', 'Under the symbols someone scratched a translation key.', 'The message hides the name of a safe place.'],
        fr: ['Tu trouves une plaque de métal couverte de symboles extraterrestres.', 'Sous les symboles, quelqu’un a gravé une clé de traduction.', 'Le message cache le nom d’un lieu sûr.'],
        de: ['Du findest eine Metallplatte voller außerirdischer Symbole.', 'Unter den Symbolen hat jemand einen Übersetzungsschlüssel eingeritzt.', 'Die Nachricht verbirgt den Namen eines sicheren Ortes.'],
        ru: ['Ты находишь металлическую пластину, покрытую символами пришельцев.', 'Под символами кто-то нацарапал ключ к переводу.', 'Послание скрывает название безопасного места.'],
        pl: ['Znajdujesz metalową płytkę pokrytą symbolami obcych.', 'Pod symbolami ktoś wydrapał klucz do tłumaczenia.', 'Wiadomość ukrywa nazwę bezpiecznego miejsca.'],
      },
      questions: [
        {
          type: 'choice',
          prompt: { en: 'What is scratched under the symbols?', fr: 'Qu’est-ce qui est gravé sous les symboles ?', de: 'Was ist unter den Symbolen eingeritzt?', ru: 'Что нацарапано под символами?' },
          options: {
            en: ['A translation key', 'A map of the city', 'A drawing of a ship'],
            fr: ['Une clé de traduction', 'Un plan de la ville', 'Un dessin de vaisseau'],
            de: ['Ein Übersetzungsschlüssel', 'Ein Stadtplan', 'Eine Zeichnung eines Schiffes'],
            ru: ['Ключ к переводу', 'Карта города', 'Рисунок корабля'],
          },
          correct: 0,
        },
        {
          type: 'input',
          prompt: { en: 'Translate into the language you are learning: „klucz”', fr: 'Traduis dans la langue apprise : « klucz »', de: 'Übersetze in die Lernsprache: „klucz”', ru: 'Переведи на изучаемый язык: «klucz»' },
          answer: { en: 'key', fr: 'clé|cle|clef', de: 'schlüssel|schluessel', ru: 'ключ' },
        },
        {
          type: 'truefalse',
          prompt: { en: 'The message hides the name of a safe place.', fr: 'Le message cache le nom d’un lieu sûr.', de: 'Die Nachricht verbirgt den Namen eines sicheren Ortes.', ru: 'Послание скрывает название безопасного места.' },
          correct: true,
        },
      ],
      rewards: {
        coins: 150, energy: 35, xp: 45,
        words: [{ target: { en: 'key', fr: 'clé', de: 'Schlüssel', ru: 'ключ' }, pl: 'klucz' }],
        story: { title: 'Złamany szyfr', textPl: 'Odszyfrowana wiadomość wskazuje kryjówkę pod miastem. Obcy używają języka jak zamka — a Ty właśnie dorobiłeś pierwszy klucz.' },
      },
    },

    /* ── NPC ── */
    {
      id: 'npc-detective', type: 'npc', chapter: 1,
      name: 'Detektyw Nowak',
      lat: 52.2260, lng: 21.0090, radius: 50, maxSpeed: 30,
      descriptionPl: 'NPC — detektyw. Dialog z wyborem właściwej reakcji.',
      vanishOnFail: false, relocateOnFail: false,
      penalty: { hp: 5, coins: 10 },
      content: {
        en: ['Psst… over here.', 'I have been tracking the aliens for months.', 'Answer my questions and I will share what I know.'],
        fr: ['Psst… par ici.', 'Je traque les extraterrestres depuis des mois.', 'Réponds à mes questions et je partagerai ce que je sais.'],
        de: ['Psst… hier drüben.', 'Ich verfolge die Außerirdischen seit Monaten.', 'Beantworte meine Fragen und ich teile, was ich weiß.'],
        ru: ['Тсс… сюда.', 'Я выслеживаю пришельцев уже несколько месяцев.', 'Ответь на мои вопросы, и я поделюсь тем, что знаю.'],
        pl: ['Psst… tutaj.', 'Od miesięcy tropię obcych.', 'Odpowiedz na moje pytania, a podzielę się tym, co wiem.'],
      },
      questions: [
        {
          type: 'choice',
          prompt: { en: 'How long has the detective been tracking the aliens?', fr: 'Depuis combien de temps le détective traque-t-il les extraterrestres ?', de: 'Wie lange verfolgt der Detektiv die Außerirdischen schon?', ru: 'Как долго детектив выслеживает пришельцев?' },
          options: {
            en: ['For months', 'For two days', 'For an hour'],
            fr: ['Depuis des mois', 'Depuis deux jours', 'Depuis une heure'],
            de: ['Seit Monaten', 'Seit zwei Tagen', 'Seit einer Stunde'],
            ru: ['Несколько месяцев', 'Два дня', 'Один час'],
          },
          correct: 0,
        },
        {
          type: 'choice',
          prompt: { en: 'The detective asks: “Are you alone?” Choose the best reply.', fr: 'Le détective demande : « Es-tu seul ? » Choisis la meilleure réponse.', de: 'Der Detektiv fragt: „Bist du allein?“ Wähle die beste Antwort.', ru: 'Детектив спрашивает: «Ты один?» Выбери лучший ответ.' },
          options: {
            en: ['Yes, I am alone.', 'Banana sandwich.', 'Seven green elephants.'],
            fr: ['Oui, je suis seul.', 'Sandwich à la banane.', 'Sept éléphants verts.'],
            de: ['Ja, ich bin allein.', 'Bananenbrot.', 'Sieben grüne Elefanten.'],
            ru: ['Да, я один.', 'Бутерброд с бананом.', 'Семь зелёных слонов.'],
          },
          correct: 0,
        },
        {
          type: 'input',
          prompt: { en: 'Translate into the language you are learning: „detektyw”', fr: 'Traduis dans la langue apprise : « detektyw »', de: 'Übersetze in die Lernsprache: „detektyw”', ru: 'Переведи на изучаемый язык: «detektyw»' },
          answer: { en: 'detective', fr: 'détective|detective', de: 'detektiv', ru: 'детектив' },
        },
      ],
      rewards: {
        coins: 150, energy: 30, xp: 40,
        words: [{ target: { en: 'detective', fr: 'détective', de: 'Detektiv', ru: 'детектив' }, pl: 'detektyw' }],
        story: { title: 'Sojusznik', textPl: 'Detektyw Nowak przekazuje Ci mapę patroli obcych. „Unikaj otwartych przestrzeni po zmroku. I ucz się słów — one naprawdę działają.”' },
      },
    },

    /* ── APTECZKA (zadanie ruchowe) ── */
    {
      id: 'k-supply-drop', type: 'medkit', chapter: 1,
      name: 'Zrzut zaopatrzenia',
      lat: 52.2340, lng: 21.0080, radius: 50, maxSpeed: 30,
      distanceTask: 700,
      descriptionPl: 'Zadanie ruchowe: przejdź 700 m, aby zabezpieczyć zrzut i zdobyć apteczkę.',
      content: {
        en: ['A supply capsule crashed nearby.', 'Secure the area by patrolling 700 metres on foot.'],
        fr: ['Une capsule de ravitaillement s’est écrasée à proximité.', 'Sécurise la zone en patrouillant 700 mètres à pied.'],
        de: ['Eine Versorgungskapsel ist in der Nähe abgestürzt.', 'Sichere das Gebiet, indem du 700 Meter zu Fuß patrouillierst.'],
        ru: ['Рядом упала капсула с припасами.', 'Обезопась район, пройдя пешком 700 метров.'],
        pl: ['Niedaleko rozbiła się kapsuła z zaopatrzeniem.', 'Zabezpiecz teren, patrolując pieszo 700 metrów.'],
      },
      questions: [],
      rewards: { coins: 100, energy: 20, xp: 30, item: 'medkit', story: { title: 'Zrzut zabezpieczony', textPl: 'W kapsule znajdujesz apteczkę i zapasy. Ruch to życie — dosłownie.' } },
    },

    /* ── ARTEFAKTY ── */
    {
      id: 'a-speech-crystal', type: 'artifact', chapter: 1, rarity: 'common',
      name: 'Kryształ mowy',
      lat: 52.2305, lng: 21.0120, radius: 45, maxSpeed: 30,
      descriptionPl: 'Zwykły artefakt — odblokowuje nowe słowo i ciekawostkę.',
      content: {
        en: ['A small crystal vibrates when you speak.', 'It stores the sound of a human voice.'],
        fr: ['Un petit cristal vibre quand tu parles.', 'Il garde le son d’une voix humaine.'],
        de: ['Ein kleiner Kristall vibriert, wenn du sprichst.', 'Er speichert den Klang einer menschlichen Stimme.'],
        ru: ['Маленький кристалл вибрирует, когда ты говоришь.', 'Он хранит звук человеческого голоса.'],
        pl: ['Mały kryształ wibruje, gdy mówisz.', 'Przechowuje dźwięk ludzkiego głosu.'],
      },
      questions: [],
      rewards: {
        coins: 80, energy: 15, xp: 20,
        words: [{ target: { en: 'voice', fr: 'voix', de: 'Stimme', ru: 'голос' }, pl: 'głos' }],
        story: { title: 'Ciekawostka', textPl: 'Ludzki głos potrafi wytworzyć ponad 100 rozróżnialnych dźwięków — obcy rozpoznają zaledwie 40 z nich.' },
      },
    },
    {
      id: 'a-translator-plate', type: 'artifact', chapter: 1, rarity: 'rare',
      name: 'Płytka tłumacza',
      lat: 52.2330, lng: 21.0210, radius: 45, maxSpeed: 30,
      descriptionPl: 'Rzadki artefakt — bonus coins i nowe słowo.',
      content: {
        en: ['An ancient device covered in four alphabets.', 'It hums softly, translating the wind.'],
        fr: ['Un appareil ancien couvert de quatre alphabets.', 'Il bourdonne doucement, traduisant le vent.'],
        de: ['Ein altes Gerät, bedeckt mit vier Alphabeten.', 'Es summt leise und übersetzt den Wind.'],
        ru: ['Древнее устройство, покрытое четырьмя алфавитами.', 'Оно тихо гудит, переводя ветер.'],
        pl: ['Starożytne urządzenie pokryte czterema alfabetami.', 'Cicho buczy, tłumacząc wiatr.'],
      },
      questions: [],
      rewards: {
        coins: 300, energy: 40, xp: 40,
        words: [{ target: { en: 'language', fr: 'langue', de: 'Sprache', ru: 'язык' }, pl: 'język' }],
        story: { title: 'Płytka tłumacza', textPl: 'Płytka reaguje na Twoją mowę. Im więcej języków znasz, tym więcej jej funkcji się odblokowuje.' },
      },
    },
    {
      id: 'a-lingua-core', type: 'artifact', chapter: 1, rarity: 'legendary', hidden: true,
      name: 'Rdzeń Lingua',
      lat: 52.2350, lng: 21.0130, radius: 45, maxSpeed: 30,
      descriptionPl: 'Legendarny artefakt — ukryty do czasu aktywacji nadajnika. Duży bonus.',
      content: {
        en: ['The core pulses with pure Lingua Energy.', 'Whoever holds it can power any human machine.'],
        fr: ['Le noyau pulse d’énergie Lingua pure.', 'Celui qui le tient peut alimenter n’importe quelle machine humaine.'],
        de: ['Der Kern pulsiert mit reiner Lingua-Energie.', 'Wer ihn hält, kann jede menschliche Maschine antreiben.'],
        ru: ['Ядро пульсирует чистой Лингва-энергией.', 'Тот, кто его держит, может питать любую человеческую машину.'],
        pl: ['Rdzeń pulsuje czystą Energią Lingwistyczną.', 'Kto go trzyma, może zasilić każdą ludzką maszynę.'],
      },
      questions: [],
      rewards: {
        coins: 3000, energy: 200, xp: 150,
        story: { title: 'Legendarne znalezisko', textPl: 'Rdzeń Lingua — serce dawnego laboratorium językowego. Obcy szukają go od początku inwazji. Teraz jest Twój.' },
      },
    },

    /* ── PAMIĘTNIK 2 (ukryty) ── */
    {
      id: 'd-scientist', type: 'diary', chapter: 1, hidden: true,
      name: 'Notatka naukowca',
      lat: 52.2250, lng: 21.0150, radius: 50, maxSpeed: 30,
      descriptionPl: 'Drugi pamiętnik — odsłaniany przez nadajnik. Wyjaśnia mechanikę Lingua Energy.',
      vanishOnFail: true, relocateOnFail: true,
      penalty: { hp: 10, coins: 20 },
      content: {
        en: ['The aliens feed on human communication.', 'Every correct sentence you speak creates Lingua Energy.', 'Our device turns this energy into coins that power our equipment.'],
        fr: ['Les extraterrestres se nourrissent de la communication humaine.', 'Chaque phrase correcte que tu prononces crée de l’Énergie Lingua.', 'Notre appareil transforme cette énergie en pièces qui alimentent notre équipement.'],
        de: ['Die Außerirdischen ernähren sich von menschlicher Kommunikation.', 'Jeder richtige Satz, den du sprichst, erzeugt Lingua-Energie.', 'Unser Gerät verwandelt diese Energie in Münzen, die unsere Ausrüstung antreiben.'],
        ru: ['Пришельцы питаются человеческим общением.', 'Каждое правильно произнесённое предложение создаёт Лингва-энергию.', 'Наше устройство превращает эту энергию в монеты, которые питают наше снаряжение.'],
        pl: ['Obcy żywią się ludzką komunikacją.', 'Każde poprawnie wypowiedziane zdanie tworzy Energię Lingwistyczną.', 'Nasze urządzenie zamienia tę energię w monety zasilające sprzęt.'],
      },
      questions: [
        {
          type: 'choice',
          prompt: { en: 'What do the aliens feed on?', fr: 'De quoi se nourrissent les extraterrestres ?', de: 'Wovon ernähren sich die Außerirdischen?', ru: 'Чем питаются пришельцы?' },
          options: {
            en: ['Human communication', 'Electricity', 'Metal'],
            fr: ['La communication humaine', 'L’électricité', 'Le métal'],
            de: ['Menschlicher Kommunikation', 'Elektrizität', 'Metall'],
            ru: ['Человеческим общением', 'Электричеством', 'Металлом'],
          },
          correct: 0,
        },
        {
          type: 'truefalse',
          prompt: { en: 'Correct sentences create Lingua Energy.', fr: 'Les phrases correctes créent de l’Énergie Lingua.', de: 'Richtige Sätze erzeugen Lingua-Energie.', ru: 'Правильные предложения создают Лингва-энергию.' },
          correct: true,
        },
        {
          type: 'input',
          prompt: { en: 'Translate into the language you are learning: „energia”', fr: 'Traduis dans la langue apprise : « energia »', de: 'Übersetze in die Lernsprache: „energia”', ru: 'Переведи на изучаемый язык: «energia»' },
          answer: { en: 'energy', fr: 'énergie|energie', de: 'energie', ru: 'энергия' },
        },
      ],
      rewards: {
        coins: 150, energy: 50, xp: 50,
        words: [{ target: { en: 'energy', fr: 'énergie', de: 'Energie', ru: 'энергия' }, pl: 'energia' }],
        story: { title: 'Teoria Energii Lingwistycznej', textPl: 'Notatka potwierdza teorię: nauka języka to nie dodatek do walki — to jej paliwo. Twoje urządzenie właśnie się skalibrowało.' },
      },
    },

    /* ── FAŁSZYWY TROP ── */
    {
      id: 'f-strange-signal', type: 'falsetrail', chapter: 1,
      name: 'Dziwny sygnał',
      lat: 52.2285, lng: 21.0230, radius: 50, maxSpeed: 30,
      descriptionPl: 'Fałszywy trop — sprawdza uważne czytanie. Zła odpowiedź kosztuje.',
      vanishOnFail: false, relocateOnFail: false,
      penalty: { hp: 5, coins: 50 },
      content: {
        en: ['The signal leads to an empty container.', 'Someone left a note: “Not everything on the map is what it seems.”'],
        fr: ['Le signal mène à un conteneur vide.', 'Quelqu’un a laissé un mot : « Tout ce qui est sur la carte n’est pas ce qu’il semble être. »'],
        de: ['Das Signal führt zu einem leeren Container.', 'Jemand hat einen Zettel hinterlassen: „Nicht alles auf der Karte ist, was es scheint.“'],
        ru: ['Сигнал ведёт к пустому контейнеру.', 'Кто-то оставил записку: «Не всё на карте является тем, чем кажется».'],
        pl: ['Sygnał prowadzi do pustego kontenera.', 'Ktoś zostawił notatkę: „Nie wszystko na mapie jest tym, czym się wydaje”.'],
      },
      questions: [
        {
          type: 'truefalse',
          prompt: { en: 'The container is full of supplies.', fr: 'Le conteneur est plein de provisions.', de: 'Der Container ist voller Vorräte.', ru: 'Контейнер полон припасов.' },
          correct: false,
        },
      ],
      rewards: { coins: 40, energy: 10, xp: 15, story: { title: 'Nauczka', textPl: 'Fałszywe tropy to broń obcych. Czytaj uważnie — dosłownie każde słowo ma znaczenie.' } },
    },

    /* ── BAZA OBCYCH ── */
    {
      id: 'b-underground-base', type: 'alienbase', chapter: 1,
      name: 'Baza pod miastem',
      lat: 52.2360, lng: 21.0230, radius: 55, maxSpeed: 30,
      requiresItem: 'scanner',
      descriptionPl: 'Mini escape room / boss. Wymaga Skanera obcych (sklep, 3000 coins). Duża nagroda.',
      vanishOnFail: true, relocateOnFail: false,
      penalty: { hp: 30, coins: 100 },
      content: {
        en: ['Your scanner reveals a hidden entrance.', 'Three language locks guard the alien core.', 'One mistake and the alarm will wake the hive.'],
        fr: ['Ton scanner révèle une entrée cachée.', 'Trois verrous linguistiques gardent le noyau extraterrestre.', 'Une seule erreur et l’alarme réveillera la ruche.'],
        de: ['Dein Scanner enthüllt einen versteckten Eingang.', 'Drei Sprachschlösser bewachen den Kern der Außerirdischen.', 'Ein Fehler und der Alarm weckt den Schwarm.'],
        ru: ['Твой сканер обнаруживает скрытый вход.', 'Три языковых замка охраняют ядро пришельцев.', 'Одна ошибка — и тревога разбудит улей.'],
        pl: ['Twój skaner ujawnia ukryte wejście.', 'Trzy językowe zamki strzegą rdzenia obcych.', 'Jeden błąd i alarm obudzi rój.'],
      },
      questions: [
        {
          type: 'input',
          prompt: { en: 'Lock 1 — translate: „drzwi”', fr: 'Verrou 1 — traduis : « drzwi »', de: 'Schloss 1 — übersetze: „drzwi”', ru: 'Замок 1 — переведи: «drzwi»' },
          answer: { en: 'door', fr: 'porte', de: 'tür|tuer', ru: 'дверь' },
        },
        {
          type: 'choice',
          prompt: { en: 'Lock 2 — what guards the alien core?', fr: 'Verrou 2 — qu’est-ce qui garde le noyau ?', de: 'Schloss 2 — was bewacht den Kern?', ru: 'Замок 2 — что охраняет ядро?' },
          options: {
            en: ['Three language locks', 'Two robots', 'A single guard'],
            fr: ['Trois verrous linguistiques', 'Deux robots', 'Un seul garde'],
            de: ['Drei Sprachschlösser', 'Zwei Roboter', 'Ein einzelner Wächter'],
            ru: ['Три языковых замка', 'Два робота', 'Один охранник'],
          },
          correct: 0,
        },
        {
          type: 'truefalse',
          prompt: { en: 'A mistake will wake the hive.', fr: 'Une erreur réveillera la ruche.', de: 'Ein Fehler weckt den Schwarm.', ru: 'Ошибка разбудит улей.' },
          correct: true,
        },
      ],
      rewards: {
        coins: 5000, energy: 300, xp: 300,
        story: { title: 'Boss pokonany', textPl: 'Rdzeń bazy gaśnie. Obcy w tym sektorze tracą kontrolę nad językowymi kodami. To pierwsza prawdziwa wygrana ludzkości.' },
      },
    },

    /* ── PORTAL ── */
    {
      id: 'p-portal-ch2', type: 'portal', chapter: 1,
      name: 'Portal: Kod w języku',
      lat: 52.2240, lng: 21.0210, radius: 55, maxSpeed: 30,
      requiresPoints: ['m-transmitter', 'd-diary-ewa', 'm-cipher'],
      descriptionPl: 'Przejście do rozdziału 2. Wymaga ukończenia nadajnika, pamiętnika Ewy i szyfru.',
      content: {
        en: ['The portal shimmers with unknown grammar.', 'Beyond it lies the next chapter of the story.'],
        fr: ['Le portail scintille d’une grammaire inconnue.', 'Au-delà se trouve le prochain chapitre de l’histoire.'],
        de: ['Das Portal schimmert mit unbekannter Grammatik.', 'Dahinter liegt das nächste Kapitel der Geschichte.'],
        ru: ['Портал мерцает неизвестной грамматикой.', 'За ним — следующая глава истории.'],
        pl: ['Portal migocze nieznaną gramatyką.', 'Za nim czeka kolejny rozdział historii.'],
      },
      questions: [],
      rewards: { coins: 1000, energy: 100, xp: 200, unlocksChapter: 2, story: { title: 'Rozdział ukończony!', textPl: 'Przekraczasz portal. Rozdział 2: „Kod w języku” został odblokowany. Admin może już budować jego misje w panelu.' } },
    },
  ],
};

/* ═══════════ SKLEP ═══════════ */
EW.SHOP = [
  { section: 'Sprzęt', items: [
    { id: 'medkit',    name: 'Apteczka',                icon: '⛑️', price: 300,  desc: 'Przywraca 50 HP. Niezbędna po nieudanych misjach.' },
    { id: 'compass',   name: 'Kompas',                  icon: '🧭', price: 500,  desc: 'Wskazuje kierunek do najbliższego aktywnego punktu.' },
    { id: 'flashlight',name: 'Latarka',                 icon: '🔦', price: 700,  desc: 'Pozwala czytać pamiętniki nocą bez kar.' },
    { id: 'keycard',   name: 'Klucz elektroniczny',     icon: '🗝️', price: 1200, desc: 'Otwiera zamknięte kontenery i przejścia.' },
    { id: 'dronefuel', name: 'Paliwo do drona',         icon: '⛽', price: 2000, desc: 'Zasila drona zwiadowczego na 24 godziny.' },
    { id: 'scanner',   name: 'Skaner obcych',           icon: '📟', price: 3000, desc: 'Wymagany do wejścia do baz obcych. Wykrywa ukryte wejścia.' },
    { id: 'shield',    name: 'Tarcza ochronna',         icon: '🛡️', price: 5000, desc: 'Chroni przed utratą HP przy jednej nieudanej misji.' },
    { id: 'generator', name: 'Generator energii',       icon: '🔋', price: 8000, desc: 'Pasywnie wytwarza +10 Lingua Energy dziennie.' },
    { id: 'regionpass',name: 'Przepustka do regionu',   icon: '🎫', price: 10000,desc: 'Odblokowuje nowy region mapy.' },
  ]},
  { section: 'Pomoc językowa', items: [
    { id: 'h-translate', name: 'Tłumaczenie zdania',    icon: '🌍', price: 100, desc: 'Kupowane kontekstowo — kliknij zdanie w pamiętniku.', passive: true },
    { id: 'h-hint',      name: 'Podpowiedź słowa',      icon: '💡', price: 50,  desc: 'Podpowiada jedno słowo w zadaniu typu „wpisz”.', passive: true },
    { id: 'h-grammar',   name: 'Analiza gramatyczna',   icon: '🔎', price: 150, desc: 'Rozkłada zdanie na części — kontekstowo w menu zdania.', passive: true },
    { id: 'h-slow',      name: 'Wolniejsze nagranie',   icon: '🐢', price: 20,  desc: 'Odtwarza zdanie w tempie 50% — w pasku TTS.', passive: true },
    { id: 'h-repeat',    name: 'Powtórzenie dialogu',   icon: '🔁', price: 10,  desc: 'Ponowne odtworzenie całego dialogu NPC.', passive: true },
  ]},
  { section: 'Kosmetyka i towarzysze', items: [
    { id: 'c-outfit',   name: 'Strój zwiadowcy',        icon: '🥷', price: 1500, desc: 'Nowy wygląd postaci na mapie.' },
    { id: 'c-backpack', name: 'Plecak taktyczny',       icon: '🎒', price: 900,  desc: 'Nowy wygląd ekwipunku.' },
    { id: 'c-voice',    name: 'Głos narratora „Echo”',  icon: '🎙️', price: 1200, desc: 'Alternatywny głos narratora.' },
    { id: 'c-maptheme', name: 'Motyw mapy „Neon”',      icon: '🗺️', price: 800,  desc: 'Alternatywna kolorystyka mapy.' },
    { id: 'c-dog',      name: 'Pies tropiący',          icon: '🐕', price: 2500, desc: 'Towarzysz — czasem znajduje dodatkowe coins.' },
    { id: 'c-drone',    name: 'Dron zwiadowczy',        icon: '🚁', price: 4000, desc: 'Odsłania punkty w promieniu 500 m.' },
    { id: 'c-robot',    name: 'Robot tłumacz',          icon: '🤖', price: 6000, desc: 'Jedno darmowe tłumaczenie dziennie.' },
    { id: 'c-skin',     name: 'Skórka interfejsu „Vice”',icon: '🎨', price: 1000, desc: 'Alternatywny motyw UI.' },
  ]},
];

/* ═══════════ OSIĄGNIĘCIA ═══════════ */
EW.ACHIEVEMENTS = [
  { id: 'first-mission', icon: '🎯', name: 'Pierwszy trop',        desc: 'Ukończ pierwszą misję.',                coins: 100,  check: s => s.player.completed.length >= 1 },
  { id: 'walk-1km',      icon: '👣', name: 'Kilometr wolności',    desc: 'Przejdź łącznie 1 km.',                 coins: 80,   check: s => s.player.distance >= 1000 },
  { id: 'walk-5km',      icon: '🏃', name: 'Maraton ocalałego',    desc: 'Przejdź łącznie 5 km.',                 coins: 500,  check: s => s.player.distance >= 5000 },
  { id: 'words-10',      icon: '📚', name: 'Łamacz kodów',         desc: 'Zbierz 10 słów/zdań w notatniku.',      coins: 300,  check: s => s.player.notebook.length >= 10 },
  { id: 'mastered-1',    icon: '🗣️', name: 'Pierwsze słowa',       desc: 'Opanuj pierwsze zdanie z pamięci.',     coins: 200,  check: s => s.player.notebook.some(n => n.reps >= 1) },
  { id: 'artifact-leg',  icon: '💠', name: 'Legenda',              desc: 'Zdób legendarny artefakt.',             coins: 1000, check: s => s.player.artifacts.some(a => a.rarity === 'legendary') },
  { id: 'chapter-1',     icon: '🌀', name: 'Pierwszy sygnał',      desc: 'Ukończ rozdział 1 (przejdź portal).',   coins: 1000, check: s => s.player.completed.includes('p-portal-ch2') },
  { id: 'streak-7',      icon: '🔥', name: 'Tydzień oporu',        desc: '7 dni gry z rzędu.',                    coins: 500,  check: s => s.player.streak >= 7 },
  { id: 'streak-30',     icon: '🌟', name: 'Miesiąc oporu',        desc: '30 dni gry z rzędu.',                   coins: 3000, check: s => s.player.streak >= 30 },
  { id: 'streak-100',    icon: '👑', name: 'Setka ocalałego',      desc: '100 dni gry z rzędu.',                  coins: 10000,check: s => s.player.streak >= 100 },
];

/* Progi coins za dystans (spec: 100 m, 500 m, 1 km, 5 km) */
EW.DISTANCE_REWARDS = [
  { every: 100,  coins: 5 },
  { every: 500,  coins: 30 },
  { every: 1000, coins: 80 },
  { every: 5000, coins: 500 },
];

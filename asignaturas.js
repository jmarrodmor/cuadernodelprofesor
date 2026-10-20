// ==========================================
// CATÁLOGO DE ASIGNATURAS Y CURRÍCULOS LOMLOE
// ==========================================

const CATALOGO_ASIGNATURAS = {
  "tecnologia": {
    id: "tecnologia",
    nombreMateria: "Tecnología (4º ESO)",

    DESCRIPCIONES_COMPETENCIAS: {
      "1": "1. Identificar y proponer problemas tecnológicos con iniciativa y creatividad, estudiando las necesidades de su entorno próximo y aplicando estrategias y procesos colaborativos e iterativos relativos a proyectos, para idear y planificar soluciones de manera eficiente, accesible, sostenible e innovadora.",
      "2": "2. Aplicar de forma apropiada y segura distintas técnicas y conocimientos interdisciplinares, utilizando procedimientos y recursos tecnológicos y analizando el ciclo de vida de productos, para fabricar soluciones tecnológicas accesibles y sostenibles que den respuesta a necesidades planteadas.",
      "3": "3. Expresar, comunicar y difundir ideas, propuestas o soluciones tecnológicas en diferentes foros de manera efectiva, usando un lenguaje inclusivo y no sexista, empleando los recursos disponibles y aplicando los elementos y las técnicas necesarias, para intercambiar la información de manera responsable y fomentar el trabajo en equipo.",
      "4": "4. Desarrollar soluciones automatizadas a problemas planteados, aplicando los conocimientos necesarios e incorporando tecnologías emergentes, para diseñar y construir sistemas de control programables y robóticos.",
      "5": "5. Aprovechar y emplear de manera responsable las posibilidades de las herramientas digitales, adaptándolas a sus necesidades, configurándolas y aplicando conocimientos interdisciplinares, para la resolución de tareas de una manera más eficiente.",
      "6": "6. Analizar procesos tecnológicos, teniendo en cuenta su impacto en la sociedad y el entorno y aplicando criterios de sostenibilidad y accesibilidad, para hacer un uso ético y ecosocialmente responsable de la tecnología."
    },

    DESCRIPCIONES_CRITERIOS: {
      "1.1": "1.1. Idear y planificar soluciones tecnológicas emprendedoras que generen un valor para la comunidad a partir de la observación y el análisis del entorno más cercano, estudiando sus necesidades, requisitos y posibilidades de mejora.",
      "1.2": "1.2. Aplicar con iniciativa estrategias colaborativas de gestión de proyectos con una perspectiva interdisciplinar y siguiendo un proceso iterativo de validación, desde la fase de ideación hasta la difusión de la solución.",
      "1.3": "1.3. Abordar la gestión del proyecto de forma creativa, aplicando estrategias y técnicas colaborativas adecuadas, así como métodos de investigación en la ideación de soluciones lo más eficientes, accesibles e innovadoras posibles.",
      "2.1": "2.1. Analizar el diseño de un producto que dé respuesta a una necesidad planteada, evaluando su demanda, evolución y previsión de fin de ciclo de vida con un criterio ético, responsable e inclusivo.",
      "2.2": "2.2. Fabricar productos y soluciones tecnológicas, aplicando herramientas de diseño asistido, técnicas de elaboración manual, mecánica y digital y utilizando los materiales y recursos mecánicos, eléctricos, electrónicos y digitales adecuados.",
      "3.1": "3.1. Intercambiar información y fomentar el trabajo en equipo de manera asertiva, empleando las herramientas digitales adecuadas junto con el vocabulario técnico, símbolos y esquemas de sistemas tecnológicos apropiados.",
      "3.2": "3.2. Presentar y difundir las propuestas o soluciones tecnológicas de manera efectiva, empleando la entonación, expresión, gestión del tiempo y adaptación adecuada del discurso, así como un lenguaje inclusivo y no sexista.",
      "4.1": "4.1. Diseñar, construir, controlar o simular sistemas automáticos programables y robots que sean capaces de realizar tareas de forma autónoma, aplicando conocimientos de mecánica, electrónica, neumática y componentes de los sistemas de control, así como otros conocimientos interdisciplinares.",
      "4.2": "4.2. Integrar en las máquinas y sistemas tecnológicos aplicaciones informáticas y tecnologías digitales emergentes de control y simulación como el internet de las cosas, el big data y la inteligencia artificial con sentido crítico y ético.",
      "5.1": "5.1. Resolver tareas propuestas de manera eficiente, mediante el uso y configuración de diferentes aplicaciones y herramientas digitales, aplicando conocimientos interdisciplinares con autonomía.",
      "6.1": "6.1. Hacer un uso responsable de la tecnología, mediante el análisis y aplicación de criterios de sostenibilidad y accesibilidad en la selección de materiales y en el diseño de estos, así como en los procesos de fabricación de productos tecnológicos, minimizando el impacto negativo en la sociedad y en el planeta.",
      "6.2": "6.2. Analizar los beneficios que, en el cuidado del entorno, aportan la arquitectura bioclimática y el ecotransporte, valorando la contribución de las tecnologías al desarrollo sostenible.",
      "6.3": "6.3. Identificar y valorar la repercusión y los beneficios del desarrollo de proyectos tecnológicos de carácter social por medio de comunidades abiertas, acciones de voluntariado o proyectos de servicio a la comunidad."
    },

    DESCRIPCIONES_DESCRIPTORES: {
      "CCL1": "Competencia lingüística: Expresa hechos y opiniones de forma oral y escrita.",
      "CP2": "Competencia plurilingüe: Interactúa en otras lenguas en situaciones cotidianas.",
      "STEM1": "STEM: Utiliza métodos deductivos e inductivos propios de las ciencias.",
      "STEM2": "STEM: Utiliza el pensamiento científico para plantear hipótesis y resolver problemas.",
      "STEM3": "STEM: Plantea y resuelve problemas analizando críticamente los resultados.",
      "STEM4": "STEM: Interpreta y transmite información con lenguaje científico y técnico.",
      "STEM5": "STEM: Emprende acciones para preservar el medio ambiente y la salud.",
      "CD1": "Competencia digital: Realiza búsquedas avanzadas e interacciona en entornos virtuales.",
      "CD2": "Competencia digital: Crea y modifica contenidos digitales en diversos formatos.",
      "CD3": "Competencia digital: Participa en actividades cooperativas con herramientas digitales.",
      "CD4": "Competencia digital: Protege la identidad digital, datos y privacidad.",
      "CD5": "Competencia digital: Desarrolla soluciones algorítmicas mediante programación.",
      "CPSAA3": "Personal, social y aprender a aprender: Evalúa sus propios aprendizajes y procesos.",
      "CPSAA4": "Personal, social y aprender a aprender: Favorece la convivencia democrática e inclusiva.",
      "CPSAA5": "Personal, social y aprender a aprender: Mantiene una actitud resiliente y de superación.",
      "CC4": "Competencia ciudadana: Analiza el impacto ecológico y promueve el desarrollo sostenible.",
      "CE1": "Competencia emprendedora: Diseña y gestiona ideas originales generando valor.",
      "CE3": "Competencia emprendedora: Desarrolla proyectos de forma cooperativa liderando tareas.",
      "CCEC3": "Conciencia cultural: Expresa ideas e impresiones utilizando diversos soportes artísticos.",
      "CCEC4": "Conciencia cultural: Diseña productos culturales teniendo en cuenta la estética."
    },

    DESCRIPCIONES_COMPETENCIAS_CLAVE: {
      "CCL": "Competencia en Comunicación Lingüística: Comprender y expresar pensamientos, emociones y conceptos de forma oral y escrita.",
      "CP": "Competencia Plurilingüe: Utilizar distintas lenguas de forma eficaz para el aprendizaje y la comunicación.",
      "STEM": "Competencia Matemática y en Ciencia, Tecnología e Ingeniería (STEM): Comprender el mundo utilizando modelos y métodos científicos.",
      "CD": "Competencia Digital: Uso seguro, crítico y responsable de las tecnologías digitales para el aprendizaje y la sociedad.",
      "CPSAA": "Competencia Personal, Social y de Aprender a Aprender: Reflexionar sobre uno mismo, gestionar el tiempo y trabajar colaborativamente.",
      "CC": "Competencia Ciudadana: Actuar como ciudadanos responsables y participar plenamente en la vida social y cívica.",
      "CE": "Competencia Emprendedora: Desarrollar la creatividad y capacidad de transformar ideas en actos que generen valor.",
      "CCEC": "Competencia en Conciencia y Expresión Culturales: Comprender y respetar cómo las ideas son expresadas en distintas culturas."
    },

    CONFIG_COMPETENCIAS_CLAVE: {
      "CCL":   { nombre: "CCL - Comunicación Lingüística", colorClass: "comp-ccl" },
      "CP":    { nombre: "CP - Plurilingüe", colorClass: "comp-cp" },
      "STEM":  { nombre: "STEM - Ciencia, Tec. y Mates", colorClass: "comp-stem" },
      "CD":    { nombre: "CD - Digital", colorClass: "comp-cd" },
      "CPSAA": { nombre: "CPSAA - Aprender a Aprender", colorClass: "comp-cpsaa" },
      "CC":    { nombre: "CC - Ciudadana", colorClass: "comp-cc" },
      "CE":    { nombre: "CE - Emprendedora", colorClass: "comp-ce" },
      "CCEC":  { nombre: "CCEC - Expresión Cultural", colorClass: "comp-ccec" }
    },

    MAPA_CURRICULAR: [
      { compNum: "1", compNombre: "1. Identificar y proponer...", descriptores: ["STEM1", "STEM2", "CD1", "CD3", "CPSAA3", "CPSAA4", "CE1", "CE3"], criterios: ["1.1", "1.2", "1.3"] },
      { compNum: "2", compNombre: "2. Aplicar de forma...", descriptores: ["STEM2", "STEM5", "CD2", "CPSAA4", "CC4", "CCEC4"], criterios: ["2.1", "2.2"] },
      { compNum: "3", compNombre: "3. Expresar, comunicar...", descriptores: ["CCL1", "STEM4", "CD3", "CPSAA3", "CCEC3"], criterios: ["3.1", "3.2"] },
      { compNum: "4", compNombre: "4. Desarrollar soluciones...", descriptores: ["CP2", "STEM1", "STEM3", "CD5", "CPSAA5", "CE3"], criterios: ["4.1", "4.2"] },
      { compNum: "5", compNombre: "5. Aprovechar y emplear...", descriptores: ["CP2", "CD2", "CD5", "CPSAA4", "CPSAA5"], criterios: ["5.1"] },
      { compNum: "6", compNombre: "6. Analizar procesos...", descriptores: ["STEM2", "STEM5", "CD4", "CC4"], criterios: ["6.1", "6.2", "6.3"] }
    ]
  },

  "tecnologia_digitalizacion": {
    id: "tecnologia_digitalizacion",
    nombreMateria: "Tecnología y digitalización (1º y 2º ESO)",

    DESCRIPCIONES_COMPETENCIAS: {
      "1": "1. Buscar, seleccionar y organizar información en entornos digitales con actitud crítica y segura.",
      "2": "2. Abordar problemas mediante el diseño y construcción de soluciones tecnológicas sostenibles.",
      "3": "3. Utilizar herramientas informáticas y de diseño para la creación de contenido digital.",
      "4": "4. Representar e comunicar ideas técnicas utilizando simbología y normalización adecuada.",
      "5": "5. Desarrollar un proyecto técnico trabajando de forma cooperativa e inclusiva.",
      "6": "6. Comprender el funcionamiento de los sistemas tecnológicos y su impacto en la sociedad.",
      "7": "7. Hacer uso responsable de los recursos tecnológicos promoviendo el desarrollo sostenible."
    },

    DESCRIPCIONES_CRITERIOS: {
      "1.1": "1.1. Buscar y seleccionar información relevante en la red con sentido crítico.",
      "1.2": "1.2. Organizar y almacenar la información digital de forma segura.",
      "1.3": "1.3. Aplicar medidas básicas de seguridad y protección de datos.",
      "2.1": "2.1. Diseñar soluciones tecnológicas creativas a problemas planteados.",
      "2.2": "2.2. Construir prototipos aplicando normas de seguridad e higiene.",
      "3.1": "3.1. Elaborar documentos y presentaciones utilizando aplicaciones informáticas.",
      "4.1": "4.1. Interpretar y realizar bocetos y croquis técnicos utilizando acotación.",
      "5.1": "5.1. Trabajar en equipo repartiendo tareas con empatía y equidad.",
      "5.2": "5.2. Planificar las fases de un proyecto técnico respetando tiempos.",
      "5.3": "5.3. Evaluar el proceso de trabajo en grupo proponiendo mejoras.",
      "6.1": "6.1. Identificar los componentes principales de un sistema informático o tecnológico.",
      "6.2": "6.2. Analizar las repercusiones del avance tecnológico en el entorno social y ambiental.",
      "6.3": "6.3. Valorar la importancia de la ciberseguridad y la identidad digital.",
      "7.1": "7.1. Evaluar el consumo energético e impacto medioambiental de la tecnología.",
      "7.2": "7.2. Aplicar criterios de economía circular en la reutilización de materiales."
    },

    DESCRIPCIONES_DESCRIPTORES: {
      "CCL1": "Competencia lingüística: Expresa hechos y opiniones de forma oral y escrita.",
      "CCL3": "Competencia lingüística: Localiza, selecciona y contrasta información de diversas fuentes.",
      "CP2": "Competencia plurilingüe: Interactúa en otras lenguas en situaciones cotidianas.",
      "STEM1": "STEM: Utiliza métodos deductivos e inductivos propios de las ciencias.",
      "STEM2": "STEM: Utiliza el pensamiento científico para plantear hipótesis y resolver problemas.",
      "STEM3": "STEM: Plantea y resuelve problemas analizando críticamente los resultados.",
      "STEM4": "STEM: Interpreta y transmite información con lenguaje científico y técnico.",
      "STEM5": "STEM: Emprende acciones para preservar el medio ambiente y la salud.",
      "CD1": "Competencia digital: Realiza búsquedas avanzadas e interacciona en entornos virtuales.",
      "CD2": "Competencia digital: Crea y modifica contenidos digitales en diversos formatos.",
      "CD3": "Competencia digital: Participa en actividades cooperativas con herramientas digitales.",
      "CD4": "Competencia digital: Protege la identidad digital, datos y privacidad.",
      "CD5": "Competencia digital: Desarrolla soluciones algorítmicas mediante programación.",
      "CPSAA1": "Personal, social y aprender a aprender: Reflexiona sobre sí mismo y sus metas.",
      "CPSAA3": "Personal, social y aprender a aprender: Evalúa sus propios aprendizajes y procesos.",
      "CPSAA4": "Personal, social y aprender a aprender: Favorece la convivencia democrática e inclusiva.",
      "CPSAA5": "Personal, social y aprender a aprender: Mantiene una actitud resiliente y de superación.",
      "CC4": "Competencia ciudadana: Analiza el impacto ecológico y promueve el desarrollo sostenible.",
      "CE1": "Competencia emprendedora: Diseña y gestiona ideas originales generando valor.",
      "CE3": "Competencia emprendedora: Desarrolla proyectos de forma cooperativa liderando tareas.",
      "CCEC3": "Conciencia cultural: Expresa ideas e impresiones utilizando diversos soportes artísticos.",
      "CCEC4": "Conciencia cultural: Diseña productos culturales teniendo en cuenta la estética."
    },

    DESCRIPCIONES_COMPETENCIAS_CLAVE: {
      "CCL": "Competencia en Comunicación Lingüística: Comprender y expresar pensamientos, emociones y conceptos de forma oral y escrita.",
      "CP": "Competencia Plurilingüe: Utilizar distintas lenguas de forma eficaz para el aprendizaje y la comunicación.",
      "STEM": "Competencia Matemática y en Ciencia, Tecnología e Ingeniería (STEM): Comprender el mundo utilizando modelos y métodos científicos.",
      "CD": "Competencia Digital: Uso seguro, crítico y responsable de las tecnologías digitales para el aprendizaje y la sociedad.",
      "CPSAA": "Competencia Personal, Social y de Aprender a Aprender: Reflexionar sobre uno mismo, gestionar el tiempo y trabajar colaborativamente.",
      "CC": "Competencia Ciudadana: Actuar como ciudadanos responsables y participar plenamente en la vida social y cívica.",
      "CE": "Competencia Emprendedora: Desarrollar la creatividad y capacidad de transformar ideas en actos que generen valor.",
      "CCEC": "Competencia en Conciencia y Expresión Culturales: Comprender y respetar cómo las ideas son expresadas en distintas culturas."
    },

    CONFIG_COMPETENCIAS_CLAVE: {
      "CCL":   { nombre: "CCL - Comunicación Lingüística", colorClass: "comp-ccl" },
      "CP":    { nombre: "CP - Plurilingüe", colorClass: "comp-cp" },
      "STEM":  { nombre: "STEM - Ciencia, Tec. y Mates", colorClass: "comp-stem" },
      "CD":    { nombre: "CD - Digital", colorClass: "comp-cd" },
      "CPSAA": { nombre: "CPSAA - Aprender a Aprender", colorClass: "comp-cpsaa" },
      "CC":    { nombre: "CC - Ciudadana", colorClass: "comp-cc" },
      "CE":    { nombre: "CE - Emprendedora", colorClass: "comp-ce" },
      "CCEC":  { nombre: "CCEC - Expresión Cultural", colorClass: "comp-ccec" }
    },

    MAPA_CURRICULAR: [
      { compNum: "1", compNombre: "1. Buscar...", descriptores: ["CCL3", "STEM2", "CD1", "CD4", "CPSAA4", "CE1"], criterios: ["1.1", "1.2", "1.3"] },
      { compNum: "2", compNombre: "2. Abordar...", descriptores: ["CCL1", "STEM1", "STEM3", "CD3", "CPSAA3", "CPSAA5", "CE1", "CE3"], criterios: ["2.1", "2.2"] },
      { compNum: "3", compNombre: "3. Utilizar...", descriptores: ["STEM2", "STEM3", "STEM5", "CD5", "CPSAA1", "CE3", "CCEC3"], criterios: ["3.1"] },
      { compNum: "4", compNombre: "4. Representar...", descriptores: ["CCL1", "STEM4", "CD3", "CCEC3", "CCEC4"], criterios: ["4.1"] },
      { compNum: "5", compNombre: "5. Desarrollar...", descriptores: ["CP2", "STEM1", "STEM3", "CD5", "CPSAA5", "CE3"], criterios: ["5.1", "5.2", "5.3"] },
      { compNum: "6", compNombre: "6. Comprender...", descriptores: ["CP2", "CD2", "CD4", "CD5", "CPSAA4", "CPSAA5"], criterios: ["6.1", "6.2", "6.3"] },
      { compNum: "7", compNombre: "7. Hacer uso...", descriptores: ["STEM2", "STEM5", "CD4", "CC4"], criterios: ["7.1", "7.2"] }
    ]
  },
  "fopp": {
    id: "fopp",
    nombreMateria: "Formación y Orientación Personal y Profesional (4º ESO)",

    DESCRIPCIONES_COMPETENCIAS: {
      "1": "1. Comprender los procesos físicos y psicológicos implicados en la cognición, la motivación y el aprendizaje, y sus implicaciones en la conducta, aplicando estrategias de aprendizaje y de gestión emocional para mejorar el desempeño personal, social y académico.",
      "2": "2. Comprender las principales características del desarrollo evolutivo de la persona, identificando las cualidades propias y de los demás, para afrontar nuevos retos con autonomía y facilitar la transición a la vida adulta.",
      "3": "3. Conocer y comprender al ser humano, sus sociedades y culturas, reflexionando de forma crítica desde las ciencias humanas y sociales y analizando la diversidad con respeto y empatía.",
      "4": "4. Conocer la dimensión social y antropológica del ser humano, desarrollando habilidades para adaptarse a nuevos grupos y contextos y valorando la diversidad, la inclusión y la igualdad real entre mujeres y hombres.",
      "5": "5. Explorar las oportunidades académicas y profesionales del entorno, presencial y virtual, para elaborar un proyecto personal, académico y profesional propio y aproximarse a la búsqueda activa de empleo."
    },

    DESCRIPCIONES_CRITERIOS: {
      "1.1": "1.1. Mejorar el desempeño personal, social y académico aplicando estrategias de aprendizaje y de gestión emocional, para tener un mayor control sobre las propias acciones y sus consecuencias.",
      "1.2": "1.2. Identificar y aplicar los procesos que intervienen en el aprendizaje, analizando sus implicaciones y desarrollando estrategias para adquirir conocimientos, destrezas y actitudes.",
      "1.3": "1.3. Analizar la importancia del componente emocional, tomando conciencia de su repercusión en el aprendizaje y desarrollando estrategias para mejorarlo.",
      "1.4": "1.4. Analizar la relación de la cognición, la motivación, el aprendizaje y la gestión emocional con la conducta propia y la de los demás.",
      "2.1": "2.1. Afrontar nuevos retos, de forma eficaz y con progresiva autonomía, identificando las cualidades personales y de los demás y los factores que condicionan la conducta a lo largo del desarrollo.",
      "2.2": "2.2. Conocer el desarrollo evolutivo de las personas, analizando y comprendiendo las principales características de la madurez en los planos físico, cognitivo, social, emocional y sexual.",
      "2.3": "2.3. Identificar cualidades personales y de los demás, reflexionando sobre la importancia de potenciar aquellas que ayudan a afrontar retos y a la transición a la vida adulta.",
      "3.1": "3.1. Reflexionar de manera crítica sobre la condición humana, la sociedad y la cultura a partir del conocimiento de las ciencias humanas y sociales.",
      "3.2": "3.2. Analizar la diversidad personal, social y cultural desde distintas perspectivas, con respeto, empatía y valoración de la equidad y la no discriminación.",
      "3.3": "3.3. Aplicar de manera consciente la empatía y el espíritu crítico ante circunstancias de diversidad planteadas en la vida cotidiana.",
      "4.1": "4.1. Desarrollar estrategias y habilidades que faciliten la adaptación a nuevos grupos y contextos a partir del conocimiento social y antropológico del ser humano.",
      "4.2": "4.2. Analizar los factores personales y socioculturales que intervienen en la configuración psicológica de la persona, contrastando distintas perspectivas sociales y antropológicas.",
      "4.3": "4.3. Valorar la diversidad desde el respeto, la inclusión y la igualdad real y efectiva entre mujeres y hombres.",
      "4.4": "4.4. Apreciar la riqueza de los contextos heterogéneos a nivel personal, social y cultural y sus posibilidades de crecimiento individual y grupal.",
      "5.1": "5.1. Explorar el entorno próximo identificando las oportunidades académicas y profesionales que ofrece, valorando las que mejor se ajustan a las cualidades e intereses propios, así como las opciones nacionales y europeas.",
      "5.2": "5.2. Realizar un proyecto personal, académico y profesional propio y aproximarse al proceso de búsqueda activa de empleo, aprovechando las oportunidades del entorno presencial y virtual."
    },

    DESCRIPCIONES_DESCRIPTORES: {
      "CD1": "Competencia digital: Realiza búsquedas en internet con criterios de validez, calidad y fiabilidad, y selecciona la información.",
      "CD3": "Competencia digital: Se comunica, participa y colabora en entornos digitales de forma responsable.",
      "CPSAA1": "Personal, social y aprender a aprender: Regula y expresa sus emociones, fortaleciendo el optimismo, la resiliencia y la autoeficacia ante los retos y cambios.",
      "CPSAA3": "Personal, social y aprender a aprender: Comprende las perspectivas y experiencias de los demás, trabaja en equipo y asume responsabilidades.",
      "CPSAA4": "Personal, social y aprender a aprender: Realiza autoevaluaciones sobre su proceso de aprendizaje y contrasta la información con fuentes fiables.",
      "CPSAA5": "Personal, social y aprender a aprender: Planea objetivos a medio plazo y desarrolla procesos metacognitivos para aprender de sus errores.",
      "CC1": "Competencia ciudadana: Analiza hechos, normas e ideas relativas a la dimensión social y ciudadana de su propia identidad.",
      "CC2": "Competencia ciudadana: Participa en la vida comunitaria con actitud democrática, respetando la diversidad y la igualdad.",
      "CC3": "Competencia ciudadana: Comprende y analiza problemas éticos fundamentales y de actualidad, desarrollando un juicio propio.",
      "CC4": "Competencia ciudadana: Comprende las relaciones entre las acciones humanas y el entorno, y adopta hábitos de vida sostenibles.",
      "CE1": "Competencia emprendedora: Analiza necesidades y oportunidades y afronta retos con sentido crítico.",
      "CE2": "Competencia emprendedora: Evalúa las fortalezas y debilidades propias y conoce los recursos para llevar a cabo sus proyectos.",
      "CE3": "Competencia emprendedora: Desarrolla ideas y proyectos valiosos, colaborando en equipo y aprendiendo de la experiencia.",
      "CCEC3": "Conciencia cultural: Expresa ideas, opiniones y emociones con creatividad y respeto, mediante distintos lenguajes y soportes."
    },

    DESCRIPCIONES_COMPETENCIAS_CLAVE: {
      "CCL": "Competencia en Comunicación Lingüística: Comprender y expresar pensamientos, emociones y conceptos de forma oral y escrita.",
      "CP": "Competencia Plurilingüe: Utilizar distintas lenguas de forma eficaz para el aprendizaje y la comunicación.",
      "STEM": "Competencia Matemática y en Ciencia, Tecnología e Ingeniería (STEM): Comprender el mundo utilizando modelos y métodos científicos.",
      "CD": "Competencia Digital: Uso seguro, crítico y responsable de las tecnologías digitales para el aprendizaje y la sociedad.",
      "CPSAA": "Competencia Personal, Social y de Aprender a Aprender: Reflexionar sobre uno mismo, gestionar el tiempo y trabajar colaborativamente.",
      "CC": "Competencia Ciudadana: Actuar como ciudadanos responsables y participar plenamente en la vida social y cívica.",
      "CE": "Competencia Emprendedora: Desarrollar la creatividad y capacidad de transformar ideas en actos que generen valor.",
      "CCEC": "Competencia en Conciencia y Expresión Culturales: Comprender y respetar cómo las ideas son expresadas en distintas culturas."
    },

    CONFIG_COMPETENCIAS_CLAVE: {
      "CCL":   { nombre: "CCL - Comunicación Lingüística", colorClass: "comp-ccl" },
      "CP":    { nombre: "CP - Plurilingüe", colorClass: "comp-cp" },
      "STEM":  { nombre: "STEM - Ciencia, Tec. y Mates", colorClass: "comp-stem" },
      "CD":    { nombre: "CD - Digital", colorClass: "comp-cd" },
      "CPSAA": { nombre: "CPSAA - Aprender a Aprender", colorClass: "comp-cpsaa" },
      "CC":    { nombre: "CC - Ciudadana", colorClass: "comp-cc" },
      "CE":    { nombre: "CE - Emprendedora", colorClass: "comp-ce" },
      "CCEC":  { nombre: "CCEC - Expresión Cultural", colorClass: "comp-ccec" }
    },

    MAPA_CURRICULAR: [
      { compNum: "1", compNombre: "1. Comprender los procesos...", descriptores: ["CPSAA1", "CPSAA3", "CPSAA4", "CPSAA5", "CE1"], criterios: ["1.1", "1.2", "1.3", "1.4"] },
      { compNum: "2", compNombre: "2. Comprender el desarrollo...", descriptores: ["CPSAA1", "CPSAA3", "CPSAA4", "CPSAA5", "CC1", "CE2"], criterios: ["2.1", "2.2", "2.3"] },
      { compNum: "3", compNombre: "3. Conocer y comprender...", descriptores: ["CPSAA3", "CC1", "CC2", "CC3", "CC4", "CE2"], criterios: ["3.1", "3.2", "3.3"] },
      { compNum: "4", compNombre: "4. Conocer la dimensión...", descriptores: ["CC1", "CC2", "CC3", "CE2", "CCEC3"], criterios: ["4.1", "4.2", "4.3", "4.4"] },
      { compNum: "5", compNombre: "5. Explorar las oportunidades...", descriptores: ["CD1", "CD3", "CPSAA4", "CPSAA5", "CE1", "CE2", "CE3"], criterios: ["5.1", "5.2"] }
    ]
  }
};

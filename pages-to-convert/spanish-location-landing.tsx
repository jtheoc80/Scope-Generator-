'use client';
import { useEffect } from "react";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Clock, DollarSign, FileCheck, MapPin, Shield, Star, Phone, Users } from "lucide-react";

interface CityData {
  name: string;
  nameEs: string;
  slug: string;
  state: string;
  stateEs: string;
  marketContext: string;
  population: string;
  constructionGrowth: string;
  hispanicPercent: string;
}

interface TradeData {
  slug: string;
  name: string;
  nameEs: string;
  displayName: string;
  displayNameEs: string;
  benefits: string[];
  features: string[];
  priceRange: string;
  commonProjects: string[];
}

const spanishCities: Record<string, CityData> = {
  "houston": {
    name: "Houston",
    nameEs: "Houston",
    slug: "houston",
    state: "TX",
    stateEs: "Texas",
    marketContext: "Sirviendo al cuarto mercado de construcción más grande del país con oportunidades durante todo el año",
    population: "2.3 millones",
    constructionGrowth: "Mercado residencial en auge con fuerte demanda de construcción nueva y remodelaciones",
    hispanicPercent: "45%"
  },
  "miami": {
    name: "Miami",
    nameEs: "Miami",
    slug: "miami",
    state: "FL",
    stateEs: "Florida",
    marketContext: "Sirviendo al dinámico mercado inmobiliario del sur de Florida con requisitos únicos de construcción costera",
    population: "442,000",
    constructionGrowth: "Alta demanda de renovaciones de lujo y mejoras resistentes a huracanes",
    hispanicPercent: "72%"
  },
  "dallas": {
    name: "Dallas",
    nameEs: "Dallas",
    slug: "dallas",
    state: "TX",
    stateEs: "Texas",
    marketContext: "Apoyando el crecimiento explosivo del área metropolitana Dallas-Fort Worth en construcción residencial",
    population: "1.3 millones",
    constructionGrowth: "Uno de los mercados de más rápido crecimiento para contratistas residenciales en Estados Unidos",
    hispanicPercent: "42%"
  },
  "phoenix": {
    name: "Phoenix",
    nameEs: "Phoenix",
    slug: "phoenix",
    state: "AZ",
    stateEs: "Arizona",
    marketContext: "Apoyando una de las ciudades de más rápido crecimiento de Estados Unidos con actividad de construcción durante todo el año",
    population: "1.6 millones",
    constructionGrowth: "Crecimiento explosivo en construcción residencial y proyectos de mejoras del hogar",
    hispanicPercent: "43%"
  },
  "los-angeles": {
    name: "Los Angeles",
    nameEs: "Los Ángeles",
    slug: "los-angeles",
    state: "CA",
    stateEs: "California",
    marketContext: "Sirviendo al mercado de construcción más grande de la costa oeste con diversas necesidades residenciales y comerciales",
    population: "3.9 millones",
    constructionGrowth: "Demanda constante de remodelaciones, ADUs y mejoras sísmicas",
    hispanicPercent: "48%"
  },
  "san-antonio": {
    name: "San Antonio",
    nameEs: "San Antonio",
    slug: "san-antonio",
    state: "TX",
    stateEs: "Texas",
    marketContext: "Sirviendo al segundo mercado más grande de Texas con fuerte herencia hispana y crecimiento constante",
    population: "1.5 millones",
    constructionGrowth: "Mercado en expansión con alta demanda de construcción residencial y remodelaciones",
    hispanicPercent: "63%"
  },
  "san-diego": {
    name: "San Diego",
    nameEs: "San Diego",
    slug: "san-diego",
    state: "CA",
    stateEs: "California",
    marketContext: "Sirviendo al mercado fronterizo de California con necesidades únicas de construcción costera",
    population: "1.4 millones",
    constructionGrowth: "Alta demanda de renovaciones residenciales y mejoras de eficiencia energética",
    hispanicPercent: "30%"
  },
  "chicago": {
    name: "Chicago",
    nameEs: "Chicago",
    slug: "chicago",
    state: "IL",
    stateEs: "Illinois",
    marketContext: "Sirviendo a la comunidad hispana más grande del Medio Oeste con diversas necesidades de construcción",
    population: "2.7 millones",
    constructionGrowth: "Mercado estable con fuerte demanda de remodelaciones y renovaciones históricas",
    hispanicPercent: "29%"
  },
  "las-vegas": {
    name: "Las Vegas",
    nameEs: "Las Vegas",
    slug: "las-vegas",
    state: "NV",
    stateEs: "Nevada",
    marketContext: "Sirviendo a uno de los mercados de más rápido crecimiento del suroeste con construcción durante todo el año",
    population: "641,000",
    constructionGrowth: "Crecimiento explosivo en construcción residencial y desarrollos nuevos",
    hispanicPercent: "33%"
  },
  "san-jose": {
    name: "San Jose",
    nameEs: "San José",
    slug: "san-jose",
    state: "CA",
    stateEs: "California",
    marketContext: "Sirviendo al corazón de Silicon Valley con proyectos de alta gama y tecnología inteligente",
    population: "1.0 millones",
    constructionGrowth: "Alta demanda de remodelaciones de lujo, ADUs y mejoras de hogar inteligente",
    hispanicPercent: "33%"
  }
};

const spanishTrades: Record<string, TradeData> = {
  "bathroom": {
    slug: "bathroom",
    name: "Bathroom Remodeling",
    nameEs: "Remodelación de Baños",
    displayName: "Bathroom Remodel",
    displayNameEs: "Remodelación de Baño",
    benefits: [
      "Plantillas pre-construidas para 5+ tipos de proyectos de baño",
      "Precios detallados con desglose de mano de obra y materiales",
      "Incluye accesorios, azulejos, plomería y trabajo eléctrico",
      "Lenguaje profesional de garantías y exclusiones"
    ],
    features: [
      "Propuestas de Conversión de Tina a Ducha",
      "Alcances de Remodelación Completa de Baño",
      "Plantillas para Medio Baño / Tocador",
      "Mejoras de Accesibilidad ADA para Baños",
      "Propuestas de Reemplazo de Lavabo y Grifería"
    ],
    priceRange: "$1,800 - $28,000+",
    commonProjects: ["Conversión tina a ducha", "Remodelación de baño principal", "Actualización de baño de visitas", "Retrofit de accesibilidad ADA"]
  },
  "kitchen": {
    slug: "kitchen",
    name: "Kitchen Remodeling",
    nameEs: "Remodelación de Cocinas",
    displayName: "Kitchen Remodel",
    displayNameEs: "Remodelación de Cocina",
    benefits: [
      "Especificaciones detalladas de gabinetes y encimeras",
      "Alcance de instalación de electrodomésticos incluido",
      "Plantillas de trabajo eléctrico y de plomería",
      "Asignaciones de materiales y opciones de mejora"
    ],
    features: [
      "Propuestas de Remodelación Completa de Cocina",
      "Alcances de Repintado y Refacing de Gabinetes",
      "Plantillas de Reemplazo de Encimeras",
      "Propuestas de Instalación de Backsplash",
      "Adición de Isla y Cambios de Diseño"
    ],
    priceRange: "$8,000 - $85,000+",
    commonProjects: ["Refacing de gabinetes", "Reemplazo de encimeras", "Remodelación completa de cocina", "Instalación de isla"]
  },
  "roofing": {
    slug: "roofing",
    name: "Roofing",
    nameEs: "Techado",
    displayName: "Roofing",
    displayNameEs: "Techado",
    benefits: [
      "Cálculos de precios basados en pies cuadrados",
      "Especificaciones de materiales para todos los tipos de techo",
      "Alcance de remoción y disposición incluido",
      "Provisiones de clima y garantía"
    ],
    features: [
      "Propuestas de Reemplazo de Tejas Asfálticas",
      "Alcances de Instalación de Techo Metálico",
      "Plantillas de Techo Plano / TPO / EPDM",
      "Estimados de Reparación y Parche de Techo",
      "Propuestas de Canaletas y Bajantes"
    ],
    priceRange: "$3,500 - $25,000+",
    commonProjects: ["Reemplazo completo de techo", "Reparación por tormenta", "Instalación de canaletas", "Recubrimiento de techo plano"]
  },
  "painting": {
    slug: "painting",
    name: "Painting",
    nameEs: "Pintura",
    displayName: "Painting",
    displayNameEs: "Pintura",
    benefits: [
      "Desgloses de alcance habitación por habitación",
      "Trabajo de preparación y reparación de superficies incluido",
      "Especificaciones de marca y acabado de pintura",
      "Selección de colores y especificaciones de capas"
    ],
    features: [
      "Propuestas de Pintura Interior de Habitaciones",
      "Alcances de Pintura Exterior de Casa",
      "Pintura y Refinishing de Gabinetes",
      "Plantillas de Teñido de Deck y Cerca",
      "Estimados de Pintura Comercial"
    ],
    priceRange: "$800 - $15,000+",
    commonProjects: ["Repintado interior", "Pintura exterior de casa", "Refinishing de gabinetes", "Teñido de deck"]
  },
  "landscaping": {
    slug: "landscaping",
    name: "Landscaping",
    nameEs: "Paisajismo",
    displayName: "Landscaping",
    displayNameEs: "Paisajismo",
    benefits: [
      "Especificaciones de plantas y materiales",
      "Cálculos de medición de hardscape",
      "Alcance de diseño de sistema de riego",
      "Planes de mantenimiento y garantías"
    ],
    features: [
      "Propuestas de Instalación de Césped y Pasto",
      "Alcances de Patio y Pasarelas de Hardscape",
      "Construcción de Muros de Retención",
      "Instalación de Sistema de Riego",
      "Plantillas de Plantación de Árboles y Arbustos"
    ],
    priceRange: "$1,500 - $50,000+",
    commonProjects: ["Rediseño de patio trasero", "Instalación de patio", "Sistema de riego", "Mejora de jardín frontal"]
  },
  "hvac": {
    slug: "hvac",
    name: "HVAC",
    nameEs: "Aire Acondicionado y Calefacción",
    displayName: "HVAC",
    displayNameEs: "HVAC",
    benefits: [
      "Especificaciones de equipo y clasificaciones SEER",
      "Documentación de cálculo de carga",
      "Alcance de ductos y líneas de refrigerante",
      "Términos de garantía y mantenimiento"
    ],
    features: [
      "Propuestas de Instalación de AC Central",
      "Alcances de Reemplazo de Horno",
      "Plantillas de Sistema Mini-Split",
      "Instalación y Reparación de Ductos",
      "Estimados de Conversión a Bomba de Calor"
    ],
    priceRange: "$3,000 - $20,000+",
    commonProjects: ["Reemplazo de AC", "Instalación de horno", "Instalación de mini-split", "Limpieza de ductos"]
  },
  "plumbing": {
    slug: "plumbing",
    name: "Plumbing",
    nameEs: "Plomería",
    displayName: "Plumbing",
    displayNameEs: "Plomería",
    benefits: [
      "Especificaciones de accesorios y materiales",
      "Lenguaje de permisos y cumplimiento de códigos",
      "Términos de garantía",
      "Provisiones de servicio de emergencia"
    ],
    features: [
      "Propuestas de Instalación de Calentador de Agua",
      "Alcances de Retubing de Toda la Casa",
      "Rough-In de Plomería de Baño",
      "Limpieza de Drenaje y Reparación de Alcantarillado",
      "Plantillas de Instalación de Línea de Gas"
    ],
    priceRange: "$500 - $15,000+",
    commonProjects: ["Reemplazo de calentador de agua", "Reparación de tuberías", "Adición de baño", "Reparación de línea de alcantarillado"]
  },
  "electrical": {
    slug: "electrical",
    name: "Electrical",
    nameEs: "Electricidad",
    displayName: "Electrical",
    displayNameEs: "Electricidad",
    benefits: [
      "Lenguaje de cumplimiento de código y permisos",
      "Especificaciones de circuito y amperaje",
      "Listas de materiales y accesorios",
      "Provisiones de seguridad y garantía"
    ],
    features: [
      "Propuestas de Actualización de Panel Eléctrico",
      "Alcances de Recableado de Toda la Casa",
      "Plantillas de Instalación de Iluminación",
      "Estimados de Instalación de Cargador EV",
      "Propuestas de Instalación de Generador"
    ],
    priceRange: "$300 - $12,000+",
    commonProjects: ["Actualización de panel", "Instalación de tomacorrientes", "Mejora de iluminación", "Instalación de cargador EV"]
  },
  "flooring": {
    slug: "flooring",
    name: "Flooring",
    nameEs: "Pisos",
    displayName: "Flooring",
    displayNameEs: "Pisos",
    benefits: [
      "Cálculos de pies cuadrados incluidos",
      "Alcance de preparación y nivelación de subpiso",
      "Especificaciones de transiciones y molduras",
      "Factor de desperdicio de material incluido"
    ],
    features: [
      "Instalación de Pisos de Madera Dura",
      "Alcances de Instalación de Piso de Azulejo",
      "Plantillas de Vinyl de Lujo (LVP)",
      "Instalación y Remoción de Alfombra",
      "Propuestas de Recubrimiento de Piso Epóxico"
    ],
    priceRange: "$2,000 - $20,000+",
    commonProjects: ["Instalación de madera dura", "Piso de azulejo", "Instalación de LVP", "Reemplazo de alfombra"]
  }
};

const spanishTestimonials: Record<string, { quote: string; author: string; business: string }> = {
  "bathroom": {
    quote: "ScopeGen redujo mi tiempo de propuestas de 2 horas a 10 minutos. Mis cotizaciones de remodelación de baño lucen más profesionales que contratistas del doble de mi tamaño.",
    author: "Miguel Rodríguez",
    business: "Rodríguez Baños y Azulejos"
  },
  "kitchen": {
    quote: "Mis propuestas de remodelación de cocina solían tomar una eternidad. Ahora puedo enviar cotizaciones profesionales el mismo día y cerrar más tratos.",
    author: "María Elena García",
    business: "García Cocinas Premium"
  },
  "roofing": {
    quote: "Escribía estimados de techado a mano por años. ScopeGen me hace ver como una operación mucho más grande.",
    author: "Carlos Hernández",
    business: "Hernández Techados"
  },
  "painting": {
    quote: "Mis propuestas de pintura lucen tan profesionales ahora. Los clientes me toman en serio y gano más licitaciones.",
    author: "José Luis Martínez",
    business: "Martínez Pintores Profesionales"
  },
  "landscaping": {
    quote: "ScopeGen me ayudó a presentar propuestas de paisajismo que coinciden con mi visión. Mi tasa de cierre subió 40%.",
    author: "Rosa Fernández",
    business: "Fernández Diseño de Paisajes"
  },
  "hvac": {
    quote: "Las propuestas de HVAC necesitan ser detalladas y técnicas. ScopeGen maneja todo eso automáticamente.",
    author: "Roberto Sánchez",
    business: "Sánchez Aire y Calefacción"
  },
  "plumbing": {
    quote: "Solía temer escribir estimados de plomería. Ahora creo propuestas profesionales en minutos.",
    author: "Antonio López",
    business: "López Servicios de Plomería"
  },
  "electrical": {
    quote: "Mis propuestas eléctricas ahora son tan profesionales como las de las grandes empresas. Los clientes confían más en mí.",
    author: "Francisco Ramírez",
    business: "Ramírez Electric LLC"
  },
  "flooring": {
    quote: "Los estimados de pisos me tomaban horas. Ahora envío propuestas profesionales el mismo día que mido.",
    author: "Ana María Torres",
    business: "Torres Soluciones de Pisos"
  }
};

interface SpanishLocationLandingPageProps {
  citySlug: string;
}

export default function SpanishLocationLandingPage({ citySlug }: SpanishLocationLandingPageProps) {
  const city = spanishCities[citySlug];

  useEffect(() => {
    const originalTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const originalDescription = metaDesc?.getAttribute("content") || "";
    
    if (city) {
      document.title = `Propuestas Profesionales para Contratistas en ${city.nameEs} | ScopeGen`;
      if (metaDesc) {
        metaDesc.setAttribute("content", `Propuestas profesionales para contratistas en ${city.nameEs}, ${city.stateEs}. Genera cotizaciones en 60 segundos. Vista previa gratis.`);
      }
    }
    
    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        metaDesc.setAttribute("content", originalDescription);
      }
    };
  }, [city]);

  if (!city) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Página No Encontrada</h1>
          <p className="text-muted-foreground mb-8">La ubicación que busca no existe.</p>
          <Link href="/" className="text-primary hover:underline">Regresar al Inicio</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-primary/30"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <span className="text-lg">🇲🇽</span>
              Completamente en Español
            </div>
            
            <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-1.5 rounded-full text-sm font-medium mb-6 ml-2">
              <MapPin className="w-4 h-4" />
              {city.nameEs}, {city.stateEs} • {city.hispanicPercent} Población Hispana
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold leading-tight mb-6" data-testid="heading-spanish-title">
              Propuestas Profesionales para Contratistas en {city.nameEs}
            </h1>
            
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              Genera propuestas profesionales y alcances de trabajo en minutos, no horas. {city.marketContext}. 
              <strong className="text-white"> Todo en español.</strong>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/app?lang=es"
                className="inline-flex items-center justify-center h-14 px-8 rounded-md bg-secondary text-slate-900 font-bold text-lg hover:bg-secondary/90 transition-all hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                data-testid="button-crear-propuesta"
              >
                Crear Mi Propuesta Gratis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a 
                href="#oficios" 
                className="inline-flex items-center justify-center h-14 px-8 rounded-md border border-slate-700 bg-slate-800/50 text-white font-medium hover:bg-slate-800 transition-colors"
                data-testid="link-ver-oficios"
              >
                Ver Todos los Oficios
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Local Market Context */}
      <section className="py-12 bg-primary/5 border-b border-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">{city.hispanicPercent}</div>
                <div className="text-sm text-muted-foreground">Población Hispana en {city.nameEs}</div>
              </div>
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <MapPin className="w-8 h-8 text-secondary mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">{city.population}</div>
                <div className="text-sm text-muted-foreground">Residentes en el Área</div>
              </div>
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <Phone className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">100%</div>
                <div className="text-sm text-muted-foreground">Soporte en Español</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Spanish Matters */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
              ¿Por Qué los Contratistas de {city.nameEs} Eligen ScopeGen?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Deja de perder horas escribiendo propuestas a mano. Nuestras plantillas incluyen todo lo que necesitan los contratistas de {city.nameEs}.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { title: "Completamente en Español", desc: "Toda la aplicación, plantillas y propuestas en español profesional" },
              { title: "Ahorra Tiempo", desc: "Crea propuestas profesionales en 2 minutos, no 2 horas" },
              { title: "Gana Más Trabajos", desc: "Propuestas profesionales que impresionan a los clientes" },
              { title: "Precios del Mercado Local", desc: "Rangos de precios actualizados para el mercado de " + city.nameEs }
            ].map((item, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-6 border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trades Section */}
      <section id="oficios" className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
              Plantillas de Propuestas para Todos los Oficios
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Selecciona tu oficio y genera propuestas profesionales al instante
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {Object.values(spanishTrades).map((trade) => (
              <div key={trade.slug} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{trade.nameEs}</h3>
                <p className="text-sm text-muted-foreground mb-4">Rango típico: {trade.priceRange}</p>
                
                <ul className="space-y-2 mb-6">
                  {trade.features.slice(0, 3).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  href={`/app?trade=${trade.slug}&lang=es`}
                  className="inline-flex items-center text-primary font-medium hover:text-primary/80 text-sm"
                  data-testid={`link-trade-${trade.slug}`}
                >
                  Crear Propuesta de {trade.displayNameEs}
                  <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
              Lo Que Dicen los Contratistas Hispanos
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {Object.entries(spanishTestimonials).slice(0, 3).map(([key, testimonial]) => (
              <div key={key} className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-secondary text-secondary" />
                  ))}
                </div>
                <blockquote className="text-slate-700 mb-4 text-sm leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{testimonial.author}</div>
                  <div className="text-muted-foreground text-xs">{testimonial.business}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
              Crea Tu Propuesta en 3 Pasos Simples
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Selecciona Tu Oficio", desc: "Elige entre más de 9 tipos de proyectos con plantillas listas para usar" },
              { step: "2", title: "Agrega Detalles", desc: "Ingresa el nombre de tu cliente, dirección y especificaciones del proyecto" },
              { step: "3", title: "Envía Tu Propuesta", desc: "Descarga en PDF, envía por correo o comparte con un enlace" }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center text-2xl font-heading font-bold text-slate-900 shadow-lg mx-auto mb-4 border-4 border-white">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="text-lg">🇲🇽</span>
            100% en Español
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-4">
            ¿Listo para Crear Propuestas Profesionales?
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8">
            Únete a miles de contratistas hispanos que ya usan ScopeGen para ganar más trabajos en {city.nameEs}.
          </p>
          
          <Link 
            href="/app?lang=es"
            className="inline-flex items-center justify-center h-14 px-10 rounded-md bg-secondary text-slate-900 font-bold text-lg hover:bg-secondary/90 transition-all hover:scale-105 shadow-[0_0_30px_rgba(249,115,22,0.4)]"
            data-testid="button-comenzar-gratis"
          >
            Comenzar Gratis
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          
          <p className="text-slate-500 text-sm mt-4">
            Vista previa gratis • No se requiere tarjeta de crédito
          </p>
        </div>
      </section>

      {/* Other Cities */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Otras Ciudades con Alta Población Hispana</h3>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {Object.values(spanishCities).filter(c => c.slug !== citySlug).map((otherCity) => (
              <Link 
                key={otherCity.slug}
                href={`/es/${otherCity.slug}`}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm transition-colors"
              >
                {otherCity.nameEs}, {otherCity.state}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

export { spanishCities, spanishTrades };

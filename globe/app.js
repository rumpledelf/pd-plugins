// ============================================================
// CONFIGURATION — Edit these URL mappings to your needs
// ============================================================

/**
 * Map continent names to destination URLs.
 * Keys must match the continent names derived from GeoJSON.
 */
const CONTINENT_URLS = {
  'Africa':        'https://en.wikipedia.org/wiki/Africa',
  'Asia':          'https://en.wikipedia.org/wiki/Asia',
  'Europe':        'https://en.wikipedia.org/wiki/Europe',
  'North America': 'https://en.wikipedia.org/wiki/North_America',
  'South America': 'https://en.wikipedia.org/wiki/South_America',
  'Oceania':       'https://en.wikipedia.org/wiki/Oceania',
  'Antarctica':    'https://en.wikipedia.org/wiki/Antarctica',
};

/**
 * Map country names to destination URLs.
 * Add entries for countries you want to be clickable.
 * Countries not listed here will still appear on the globe
 * but won't navigate anywhere on click.
 *
 * A few examples are included — add as many as you like.
 */
const COUNTRY_URLS = {
  'Australia':       'https://en.wikipedia.org/wiki/Australia',
  'United States':   'https://en.wikipedia.org/wiki/United_States',
  'Canada':          'https://en.wikipedia.org/wiki/Canada',
  'Brazil':          'https://en.wikipedia.org/wiki/Brazil',
  'United Kingdom':  'https://en.wikipedia.org/wiki/United_Kingdom',
  'France':          'https://en.wikipedia.org/wiki/France',
  'Germany':         'https://en.wikipedia.org/wiki/Germany',
  'Japan':           'https://en.wikipedia.org/wiki/Japan',
  'China':           'https://en.wikipedia.org/wiki/China',
  'India':           'https://en.wikipedia.org/wiki/India',
  'Russia':          'https://en.wikipedia.org/wiki/Russia',
  'South Africa':    'https://en.wikipedia.org/wiki/South_Africa',
  'Nigeria':         'https://en.wikipedia.org/wiki/Nigeria',
  'Egypt':           'https://en.wikipedia.org/wiki/Egypt',
  'Mexico':          'https://en.wikipedia.org/wiki/Mexico',
  'Argentina':       'https://en.wikipedia.org/wiki/Argentina',
  'Italy':           'https://en.wikipedia.org/wiki/Italy',
  'Spain':           'https://en.wikipedia.org/wiki/Spain',
  'South Korea':     'https://en.wikipedia.org/wiki/South_Korea',
  'Indonesia':       'https://en.wikipedia.org/wiki/Indonesia',
  'New Zealand':     'https://en.wikipedia.org/wiki/New_Zealand',
  'Norway':          'https://en.wikipedia.org/wiki/Norway',
  'Sweden':          'https://en.wikipedia.org/wiki/Sweden',
  'Kenya':           'https://en.wikipedia.org/wiki/Kenya',
  'Thailand':        'https://en.wikipedia.org/wiki/Thailand',
  'Turkey':          'https://en.wikipedia.org/wiki/Turkey',
  'Saudi Arabia':    'https://en.wikipedia.org/wiki/Saudi_Arabia',
  'Iran':            'https://en.wikipedia.org/wiki/Iran',
  'Colombia':        'https://en.wikipedia.org/wiki/Colombia',
  'Chile':           'https://en.wikipedia.org/wiki/Chile',
  'Peru':            'https://en.wikipedia.org/wiki/Peru',
  'Poland':          'https://en.wikipedia.org/wiki/Poland',
  'Ukraine':         'https://en.wikipedia.org/wiki/Ukraine',
  'Netherlands':     'https://en.wikipedia.org/wiki/Netherlands',
  'Portugal':        'https://en.wikipedia.org/wiki/Portugal',
  'Greece':          'https://en.wikipedia.org/wiki/Greece',
  'Ireland':         'https://en.wikipedia.org/wiki/Ireland',
  'Iceland':         'https://en.wikipedia.org/wiki/Iceland',
  'Finland':         'https://en.wikipedia.org/wiki/Finland',
  'Denmark':         'https://en.wikipedia.org/wiki/Denmark',
  'Switzerland':     'https://en.wikipedia.org/wiki/Switzerland',
  'Austria':         'https://en.wikipedia.org/wiki/Austria',
  'Belgium':         'https://en.wikipedia.org/wiki/Belgium',
  'Czech Republic':  'https://en.wikipedia.org/wiki/Czech_Republic',
  'Romania':         'https://en.wikipedia.org/wiki/Romania',
  'Vietnam':         'https://en.wikipedia.org/wiki/Vietnam',
  'Philippines':     'https://en.wikipedia.org/wiki/Philippines',
  'Malaysia':        'https://en.wikipedia.org/wiki/Malaysia',
  'French Guiana':   'https://en.wikipedia.org/wiki/French_Guiana',
  'Singapore':       'https://en.wikipedia.org/wiki/Singapore',
  'Pakistan':        'https://en.wikipedia.org/wiki/Pakistan',
  'Bangladesh':      'https://en.wikipedia.org/wiki/Bangladesh',
  'Sri Lanka':       'https://en.wikipedia.org/wiki/Sri_Lanka',
  'Nepal':           'https://en.wikipedia.org/wiki/Nepal',
  'Mongolia':        'https://en.wikipedia.org/wiki/Mongolia',
  'Kazakhstan':      'https://en.wikipedia.org/wiki/Kazakhstan',
  'Morocco':         'https://en.wikipedia.org/wiki/Morocco',
  'Algeria':         'https://en.wikipedia.org/wiki/Algeria',
  'Ethiopia':        'https://en.wikipedia.org/wiki/Ethiopia',
  'Tanzania':        'https://en.wikipedia.org/wiki/Tanzania',
  'Ghana':           'https://en.wikipedia.org/wiki/Ghana',
  'Cuba':            'https://en.wikipedia.org/wiki/Cuba',
  'Jamaica':         'https://en.wikipedia.org/wiki/Jamaica',
  'Papua New Guinea':'https://en.wikipedia.org/wiki/Papua_New_Guinea',
  'Fiji':            'https://en.wikipedia.org/wiki/Fiji',
};

// ============================================================
// Continent mapping from ISO 3166-1 numeric codes
// ============================================================
const COUNTRY_TO_CONTINENT = {};
const COUNTRY_NAME_TO_CONTINENT = {
  'Timor-Leste': 'Asia',
  'Kosovo': 'Europe',
  'Somaliland': 'Africa',
  'N. Cyprus': 'Europe',
  'Northern Cyprus': 'Europe',
  'Fr. S. Antarctic Lands': 'Antarctica',
  'French Southern and Antarctic Lands': 'Antarctica',
  'French Guiana': 'South America',
};
const CONTINENT_GROUPS = {
  'Africa': [12,24,72,108,120,132,140,148,174,178,180,204,226,231,232,262,266,270,288,324,384,404,426,430,434,450,454,466,478,480,504,508,516,562,566,624,638,646,678,686,694,706,710,716,728,732,729,736,748,768,788,800,818,834,854,894,901],
  'Asia': [4,31,48,50,51,64,96,104,116,144,156,158,162,166,275,268,344,356,360,364,368,376,392,398,400,408,410,414,417,418,422,446,458,462,496,512,524,586,608,634,643,682,702,144,704,760,762,764,784,792,795,860,887,902],
  'Europe': [8,20,40,56,70,100,112,191,196,203,208,233,234,246,250,276,292,300,304,336,348,352,372,380,428,438,440,442,470,492,498,499,528,578,616,620,642,674,688,703,705,724,744,752,756,804,807,826,831,832,833,900],
  'North America': [28,44,52,60,84,92,124,136,188,192,212,214,222,304,308,312,320,332,340,388,474,484,500,531,534,535,558,591,630,652,659,660,662,663,666,670,780,796,840,850],
  'South America': [32,68,74,76,152,170,218,238,254,328,600,604,740,858,862],
  'Oceania': [16,36,90,162,166,184,242,258,296,316,520,540,548,554,570,574,580,583,584,585,598,612,772,776,780,798,876,882],
  'Antarctica': [10],
};

// Build reverse lookup
for (const [continent, codes] of Object.entries(CONTINENT_GROUPS)) {
  for (const code of codes) {
    // First assignment wins — some codes appear in multiple continents
    // due to the simplified mapping. We keep the first.
    if (!COUNTRY_TO_CONTINENT[code]) {
      COUNTRY_TO_CONTINENT[code] = continent;
    }
  }
}

// ============================================================
// Color palettes
// ============================================================
const CONTINENT_COLORS = {
  'Africa':        { base: 'rgba(255, 159, 67, 0.55)',  hover: 'rgba(255, 159, 67, 0.85)',  border: 'rgba(255, 159, 67, 0.9)' },
  'Asia':          { base: 'rgba(232, 67, 147, 0.50)',  hover: 'rgba(232, 67, 147, 0.80)',  border: 'rgba(232, 67, 147, 0.9)' },
  'Europe':        { base: 'rgba(108, 92, 231, 0.55)',  hover: 'rgba(108, 92, 231, 0.85)',  border: 'rgba(108, 92, 231, 0.9)' },
  'North America': { base: 'rgba(0, 206, 201, 0.50)',   hover: 'rgba(0, 206, 201, 0.80)',   border: 'rgba(0, 206, 201, 0.9)' },
  'South America': { base: 'rgba(85, 230, 130, 0.50)',  hover: 'rgba(85, 230, 130, 0.80)',  border: 'rgba(85, 230, 130, 0.9)' },
  'Oceania':       { base: 'rgba(253, 121, 168, 0.50)', hover: 'rgba(253, 121, 168, 0.80)', border: 'rgba(253, 121, 168, 0.9)' },
  'Antarctica':    { base: 'rgba(200, 214, 229, 0.40)', hover: 'rgba(200, 214, 229, 0.70)', border: 'rgba(200, 214, 229, 0.8)' },
};

const DEFAULT_COLOR = { base: 'rgba(99, 110, 140, 0.35)', hover: 'rgba(99, 110, 140, 0.65)', border: 'rgba(99, 110, 140, 0.7)' };

// ============================================================
// State
// ============================================================
let currentMode = 'continents'; // 'continents' | 'countries'
let countriesGeoJson = null;
let continentsGeoJson = null;
let hoveredPolygon = null;
let globe = null;

// ============================================================
// DOM refs
// ============================================================
const $container    = document.getElementById('globeContainer');
const $tooltip      = document.getElementById('tooltip');
const $tooltipName  = document.getElementById('tooltipName');
const $tooltipUrl   = document.getElementById('tooltipUrl');
const $infoPanel    = document.getElementById('infoPanel');
const $infoLabel    = document.getElementById('infoLabel');
const $infoName     = document.getElementById('infoName');
const $infoUrl      = document.getElementById('infoUrl');
const $loading      = document.getElementById('loadingOverlay');
const $btnCont      = document.getElementById('btnContinents');
const $btnCountry   = document.getElementById('btnCountries');
const $indicator    = document.getElementById('modeIndicator');

// ============================================================
// Helpers
// ============================================================

function getCountryName(feat) {
  return feat.properties.name || feat.properties.NAME || feat.properties.ADMIN || 'Unknown';
}

function getCountryId(feat) {
  return parseInt(feat.id) || parseInt(feat.properties.iso_n3) || 0;
}

function getContinentForFeature(feat) {
  if (feat.properties?.continent) {
    return feat.properties.continent;
  }
  const name = getCountryName(feat);
  if (COUNTRY_NAME_TO_CONTINENT[name]) {
    return COUNTRY_NAME_TO_CONTINENT[name];
  }
  const id = getCountryId(feat);
  return COUNTRY_TO_CONTINENT[id] || 'Unknown';
}

function getColorForFeature(feat, isHovered) {
  const continent = getContinentForFeature(feat);
  const palette = CONTINENT_COLORS[continent] || DEFAULT_COLOR;
  return isHovered ? palette.hover : palette.base;
}

function getBorderColorForFeature(feat) {
  const continent = getContinentForFeature(feat);
  const palette = CONTINENT_COLORS[continent] || DEFAULT_COLOR;
  return palette.border;
}

function getUrlForFeature(feat) {
  if (currentMode === 'continents') {
    const continent = getContinentForFeature(feat);
    return CONTINENT_URLS[continent] || null;
  } else {
    const name = getCountryName(feat);
    return COUNTRY_URLS[name] || null;
  }
}

function getDisplayName(feat) {
  if (currentMode === 'continents') {
    return getContinentForFeature(feat);
  }
  return getCountryName(feat);
}

// ============================================================
// Normalize source data and build continent polygons
// ============================================================
function getPolygonBoundsCenter(rings) {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const ring of rings) {
    for (const point of ring) {
      const [lng, lat] = point;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  return {
    lng: (minLng + maxLng) / 2,
    lat: (minLat + maxLat) / 2,
  };
}

function isSouthAmericaPolygon(rings) {
  const center = getPolygonBoundsCenter(rings);
  return center.lng >= -90 && center.lng <= -20 && center.lat >= -60 && center.lat <= 20;
}

function getGeometryName(geometry) {
  return geometry.properties?.name || geometry.properties?.NAME || geometry.properties?.ADMIN || 'Unknown';
}

function getContinentForGeometry(geometry) {
  const name = getGeometryName(geometry);
  if (COUNTRY_NAME_TO_CONTINENT[name]) {
    return COUNTRY_NAME_TO_CONTINENT[name];
  }
  const id = parseInt(geometry.id) || parseInt(geometry.properties?.iso_n3) || 0;
  return COUNTRY_TO_CONTINENT[id] || 'Unknown';
}

function isEuropeanRussiaExclave(rings) {
  const center = getPolygonBoundsCenter(rings);
  return center.lng >= 18 && center.lng <= 25 && center.lat >= 53 && center.lat <= 57;
}

function expandGeometryForContinentMerge(topology, geometry) {
  if (geometry.type !== 'MultiPolygon') {
    return [{ geometry, continent: getContinentForGeometry(geometry) }];
  }

  const name = getGeometryName(geometry);
  if (name !== 'Russia') {
    return [{ geometry, continent: getContinentForGeometry(geometry) }];
  }

  const feature = topojson.feature(topology, geometry);
  if (feature.geometry?.type !== 'MultiPolygon') {
    return [{ geometry, continent: getContinentForGeometry(geometry) }];
  }

  const results = [];
  const defaultContinent = getContinentForGeometry(geometry);

  feature.geometry.coordinates.forEach((polygon, index) => {
    const continent = isEuropeanRussiaExclave(polygon) ? 'Europe' : defaultContinent;
    results.push({
      continent,
      geometry: {
        ...geometry,
        type: 'Polygon',
        arcs: geometry.arcs[index],
      },
    });
  });

  return results;
}

function splitFranceGeometry(topology) {
  const geometries = topology.objects.countries.geometries;
  const franceIndex = geometries.findIndex((geometry) => getGeometryName(geometry) === 'France' && geometry.type === 'MultiPolygon');
  if (franceIndex === -1) return topology;

  const france = geometries[franceIndex];
  const franceFeature = topojson.feature(topology, france);
  if (franceFeature.geometry?.type !== 'MultiPolygon') {
    return topology;
  }

  const southAmericaPolygons = [];
  const otherPolygons = [];
  const southAmericaArcs = [];
  const otherArcs = [];

  franceFeature.geometry.coordinates.forEach((polygon, index) => {
    if (isSouthAmericaPolygon(polygon)) {
      southAmericaPolygons.push(polygon);
      southAmericaArcs.push(france.arcs[index]);
    } else {
      otherPolygons.push(polygon);
      otherArcs.push(france.arcs[index]);
    }
  });

  if (!southAmericaPolygons.length || !otherPolygons.length) {
    return topology;
  }

  const updated = [...geometries];
  updated[franceIndex] = {
    ...france,
    type: otherArcs.length === 1 ? 'Polygon' : 'MultiPolygon',
    arcs: otherArcs.length === 1 ? otherArcs[0] : otherArcs,
    properties: {
      ...france.properties,
      name: 'France',
    },
  };
  updated.splice(
    franceIndex + 1,
    0,
    {
      ...france,
      id: '254',
      type: southAmericaArcs.length === 1 ? 'Polygon' : 'MultiPolygon',
      arcs: southAmericaArcs.length === 1 ? southAmericaArcs[0] : southAmericaArcs,
      properties: {
        ...france.properties,
        name: 'French Guiana',
      },
    }
  );

  topology.objects.countries.geometries = updated;
  return topology;
}

function normalizeTopology(topology) {
  return splitFranceGeometry(topology);
}

function buildContinentFeatures(topology) {
  const features = [];
  const continentGeometries = new Map();

  for (const geometry of topology.objects.countries.geometries) {
    for (const part of expandGeometryForContinentMerge(topology, geometry)) {
      if (!continentGeometries.has(part.continent)) {
        continentGeometries.set(part.continent, []);
      }
      continentGeometries.get(part.continent).push(part.geometry);
    }
  }

  for (const continent of Object.keys(CONTINENT_URLS)) {
    const geometries = continentGeometries.get(continent) || [];
    if (!geometries.length) continue;

    features.push({
      type: 'Feature',
      properties: {
        name: continent,
        continent,
      },
      geometry: topojson.merge(topology, geometries),
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

// ============================================================
// Country name map (ISO 3166-1 numeric → name)
// ============================================================
const COUNTRY_NAMES = {
  '4':'Afghanistan','8':'Albania','10':'Antarctica','12':'Algeria','16':'American Samoa',
  '20':'Andorra','24':'Angola','28':'Antigua and Barbuda','31':'Azerbaijan','32':'Argentina',
  '36':'Australia','40':'Austria','44':'Bahamas','48':'Bahrain','50':'Bangladesh',
  '51':'Armenia','52':'Barbados','56':'Belgium','60':'Bermuda','64':'Bhutan',
  '68':'Bolivia','70':'Bosnia and Herzegovina','72':'Botswana','76':'Brazil','84':'Belize',
  '90':'Solomon Islands','92':'British Virgin Islands','96':'Brunei','100':'Bulgaria',
  '104':'Myanmar','108':'Burundi','112':'Belarus','116':'Cambodia','120':'Cameroon',
  '124':'Canada','132':'Cape Verde','136':'Cayman Islands','140':'Central African Republic',
  '144':'Sri Lanka','148':'Chad','152':'Chile','156':'China','158':'Taiwan',
  '170':'Colombia','174':'Comoros','178':'Republic of the Congo','180':'Democratic Republic of the Congo',
  '184':'Cook Islands','188':'Costa Rica','191':'Croatia','192':'Cuba','196':'Cyprus',
  '203':'Czech Republic','204':'Benin','208':'Denmark','212':'Dominica',
  '214':'Dominican Republic','218':'Ecuador','222':'El Salvador','226':'Equatorial Guinea',
  '231':'Ethiopia','232':'Eritrea','233':'Estonia','234':'Faroe Islands',
  '238':'Falkland Islands','242':'Fiji','246':'Finland','250':'France',
  '254':'French Guiana','258':'French Polynesia','262':'Djibouti','266':'Gabon',
  '268':'Georgia','270':'Gambia','275':'Palestine','276':'Germany','288':'Ghana',
  '292':'Gibraltar','296':'Kiribati','300':'Greece','304':'Greenland','308':'Grenada',
  '312':'Guadeloupe','316':'Guam','320':'Guatemala','324':'Guinea','328':'Guyana',
  '332':'Haiti','336':'Vatican City','340':'Honduras','344':'Hong Kong','348':'Hungary',
  '352':'Iceland','356':'India','360':'Indonesia','364':'Iran','368':'Iraq',
  '372':'Ireland','376':'Israel','380':'Italy','384':'Ivory Coast','388':'Jamaica',
  '392':'Japan','398':'Kazakhstan','400':'Jordan','404':'Kenya','408':'North Korea',
  '410':'South Korea','414':'Kuwait','417':'Kyrgyzstan','418':'Laos','422':'Lebanon',
  '426':'Lesotho','428':'Latvia','430':'Liberia','434':'Libya','438':'Liechtenstein',
  '440':'Lithuania','442':'Luxembourg','446':'Macau','450':'Madagascar','454':'Malawi',
  '458':'Malaysia','462':'Maldives','466':'Mali','470':'Malta','474':'Martinique',
  '478':'Mauritania','480':'Mauritius','484':'Mexico','492':'Monaco','496':'Mongolia',
  '498':'Moldova','499':'Montenegro','504':'Morocco','508':'Mozambique','512':'Oman',
  '516':'Namibia','520':'Nauru','524':'Nepal','528':'Netherlands','531':'Curaçao',
  '534':'Sint Maarten','540':'New Caledonia','548':'Vanuatu','554':'New Zealand',
  '558':'Nicaragua','562':'Niger','566':'Nigeria','570':'Niue','578':'Norway',
  '580':'Northern Mariana Islands','583':'Micronesia','584':'Marshall Islands',
  '585':'Palau','586':'Pakistan','591':'Panama','598':'Papua New Guinea',
  '600':'Paraguay','604':'Peru','608':'Philippines','616':'Poland','620':'Portugal',
  '624':'Guinea-Bissau','630':'Puerto Rico','634':'Qatar','638':'Réunion',
  '642':'Romania','643':'Russia','646':'Rwanda','659':'Saint Kitts and Nevis',
  '662':'Saint Lucia','670':'Saint Vincent and the Grenadines','674':'San Marino',
  '678':'São Tomé and Príncipe','682':'Saudi Arabia','686':'Senegal','688':'Serbia',
  '690':'Seychelles','694':'Sierra Leone','702':'Singapore','703':'Slovakia',
  '704':'Vietnam','705':'Slovenia','706':'Somalia','710':'South Africa',
  '716':'Zimbabwe','724':'Spain','728':'South Sudan','729':'Sudan','732':'Western Sahara',
  '740':'Suriname','748':'Eswatini','752':'Sweden','756':'Switzerland',
  '760':'Syria','762':'Tajikistan','764':'Thailand','768':'Togo',
  '772':'Tokelau','776':'Tonga','780':'Trinidad and Tobago',
  '784':'United Arab Emirates','788':'Tunisia','792':'Turkey','795':'Turkmenistan',
  '796':'Turks and Caicos Islands','798':'Tuvalu','800':'Uganda','804':'Ukraine',
  '807':'North Macedonia','818':'Egypt','826':'United Kingdom','834':'Tanzania',
  '840':'United States','850':'U.S. Virgin Islands','854':'Burkina Faso',
  '858':'Uruguay','860':'Uzbekistan','862':'Venezuela','876':'Wallis and Futuna',
  '882':'Samoa','887':'Yemen','894':'Zambia',
  
  '900':'Kosovo',
  '901':'Somaliland',
  '902':'Timor-Leste',
};

// ============================================================
// Data loading
// ============================================================
async function loadData() {
  const TOPOJSON_URLS = [
    'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
    'data/countries-110m.json',
  ];

  async function loadTopojson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    const topology = await res.json();
    return normalizeTopology(topology);
  }

  try {
    let topology = null;
    let lastError = null;
    for (const url of TOPOJSON_URLS) {
      try {
        topology = await loadTopojson(url);
        break;
      } catch (err) {
        lastError = err;
        console.warn('TopoJSON load failed:', url, err);
      }
    }
    if (!topology) throw lastError || new Error('No TopoJSON source could be loaded');
    const countries = topojson.feature(topology, topology.objects.countries);

    // Apply names from our embedded map
    for (const feat of countries.features) {
      if (!feat.properties) feat.properties = {};
      const id = String(feat.id);
      feat.properties.name = COUNTRY_NAMES[id]
        || COUNTRY_NAMES[String(parseInt(id))]
        || feat.properties.name
        || 'Unknown';
    }

    countriesGeoJson = countries;
    continentsGeoJson = buildContinentFeatures(topology);
    return countries;

  } catch (err) {
    console.error('Failed to load TopoJSON:', err);
    throw err;
  }
}

// ============================================================
// Globe initialization
// ============================================================
function initGlobe(geoData) {
  globe = Globe()
    .polygonsData(geoData.features)
    .polygonCapColor(d => getColorForFeature(d, d === hoveredPolygon))
    .polygonSideColor(() => 'rgba(30, 30, 60, 0.25)')
    .polygonStrokeColor(d => {
      if (d === hoveredPolygon) return getBorderColorForFeature(d);
      return 'rgba(255, 255, 255, 0.08)';
    })
    .polygonAltitude(d => d === hoveredPolygon ? 0.025 : 0.008)
    .polygonLabel(() => '') // We use our own tooltip
    .onPolygonHover(handleHover)
    .onPolygonClick(handleClick)
    .polygonsTransitionDuration(200)
    .atmosphereColor('#6c5ce7')
    .atmosphereAltitude(0.18)
    ($container);

  globe.globeMaterial().color.set('#0585BA');
  globe.backgroundColor('#000000');

  // Set initial point of view
  globe.pointOfView({ lat: 20, lng: 10, altitude: 2.2 }, 1000);

  // Auto-rotate
  const controls = globe.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  // Make globe responsive
  function handleResize() {
    globe.width(window.innerWidth);
    globe.height(window.innerHeight);
  }
  window.addEventListener('resize', handleResize);
  handleResize();
}

// ============================================================
// Interaction handlers
// ============================================================

function handleHover(polygon, prevPolygon) {
  hoveredPolygon = polygon;
  $container.style.cursor = polygon ? 'pointer' : 'grab';

  if (polygon) {
    const name = getDisplayName(polygon);
    const url = getUrlForFeature(polygon);

    // Show info panel
    $infoLabel.textContent = currentMode === 'continents' ? 'CONTINENT' : 'COUNTRY';
    $infoName.textContent = name;
    $infoUrl.textContent = url || 'No URL configured';
    $infoPanel.classList.remove('hidden');

    // Pause auto-rotate on hover
    globe.controls().autoRotate = false;
  } else {
    $infoPanel.classList.add('hidden');
    // Resume auto-rotate
    globe.controls().autoRotate = true;
  }

  // Trigger re-render of polygon colors/altitude
  globe
    .polygonCapColor(d => getColorForFeature(d, d === hoveredPolygon))
    .polygonStrokeColor(d => {
      if (d === hoveredPolygon) return getBorderColorForFeature(d);
      return 'rgba(255, 255, 255, 0.08)';
    })
    .polygonAltitude(d => d === hoveredPolygon ? 0.025 : 0.008);
}

function handleClick(polygon, event) {
  if (!polygon) return;

  const url = getUrlForFeature(polygon);
  const name = getDisplayName(polygon);

  if (url) {
    // Brief visual feedback
    $infoName.style.color = '#00cec9';
    setTimeout(() => {
      $infoName.style.color = '';
    }, 300);

    // Navigate
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    // Flash to indicate no URL configured
    $infoUrl.textContent = '⚠ No URL configured for ' + name;
    $infoUrl.style.color = '#fdcb6e';
    setTimeout(() => {
      $infoUrl.style.color = '';
    }, 1500);
  }
}

// Tooltip follows cursor
document.addEventListener('mousemove', (e) => {
  if (hoveredPolygon) {
    const name = getDisplayName(hoveredPolygon);
    const url = getUrlForFeature(hoveredPolygon);

    $tooltipName.textContent = name;
    $tooltipUrl.textContent = url ? url : 'No URL set';
    $tooltip.classList.remove('hidden');
    $tooltip.style.left = e.clientX + 'px';
    $tooltip.style.top = e.clientY + 'px';
  } else {
    $tooltip.classList.add('hidden');
  }
});

// ============================================================
// Mode switching
// ============================================================

function setMode(mode) {
  if (mode === currentMode) return;
  currentMode = mode;

  // Update button states
  $btnCont.classList.toggle('active', mode === 'continents');
  $btnCountry.classList.toggle('active', mode === 'countries');

  // Slide indicator
  $indicator.classList.toggle('right', mode === 'countries');

  // Update globe data
  const data = mode === 'continents' ? continentsGeoJson : countriesGeoJson;
  if (globe && data) {
    hoveredPolygon = null;
    $infoPanel.classList.add('hidden');
    globe.polygonsData(data.features);
  }
}

$btnCont.addEventListener('click', () => setMode('continents'));
$btnCountry.addEventListener('click', () => setMode('countries'));

// ============================================================
// On-screen error display (no dev tools needed)
// ============================================================
function showError(msg, details) {
  console.error(msg, details);
  const $loadText = document.querySelector('.loading-text');
  if ($loadText) {
    $loadText.innerHTML = '';
  }

  // Create or reuse error panel
  let panel = document.getElementById('errorPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'errorPanel';
    Object.assign(panel.style, {
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      maxHeight: '40vh',
      overflowY: 'auto',
      zIndex: '9999',
      background: 'rgba(20, 0, 0, 0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 80, 80, 0.4)',
      borderRadius: '12px',
      padding: '16px 20px',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ff6b6b',
      boxShadow: '0 4px 30px rgba(255, 0, 0, 0.15)',
    });
    document.body.appendChild(panel);
  }

  const entry = document.createElement('div');
  entry.style.marginBottom = '8px';
  entry.style.borderBottom = '1px solid rgba(255,80,80,0.15)';
  entry.style.paddingBottom = '8px';

  const timestamp = new Date().toLocaleTimeString();
  entry.innerHTML = `
    <div style="color:#ff8787;font-weight:bold;margin-bottom:4px;">⚠ ${timestamp} — ${escapeHtml(msg)}</div>
    <div style="color:#cc5555;white-space:pre-wrap;word-break:break-all;">${escapeHtml(String(details))}</div>
  `;
  panel.appendChild(entry);
  panel.scrollTop = panel.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Catch unhandled errors globally
window.addEventListener('error', (e) => {
  showError('Uncaught error', `${e.message}\n  at ${e.filename}:${e.lineno}:${e.colno}`);
});
window.addEventListener('unhandledrejection', (e) => {
  showError('Unhandled promise rejection', e.reason);
});

// ============================================================
// Boot
// ============================================================

(async function boot() {
  try {
    await loadData();
    const geoData = currentMode === 'continents' ? continentsGeoJson : countriesGeoJson;
    initGlobe(geoData);

    // Hide loading screen
    setTimeout(() => {
      $loading.classList.add('hidden');
    }, 600);
  } catch (err) {
    showError('Failed to load globe data', err.stack || err.message || err);
    document.querySelector('.loading-text').textContent = 'Error — see details below ↓';
  }
})();

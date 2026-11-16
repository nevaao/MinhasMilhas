export interface Airport { iata: string; city: string; region: string; name: string }

// IATA | cidade | UF ou país | aeroporto
const RAW = `
GRU|São Paulo|SP|Guarulhos
CGH|São Paulo|SP|Congonhas
VCP|Campinas|SP|Viracopos
SDU|Rio de Janeiro|RJ|Santos Dumont
GIG|Rio de Janeiro|RJ|Galeão
CNF|Belo Horizonte|MG|Confins
PLU|Belo Horizonte|MG|Pampulha
BSB|Brasília|DF|Juscelino Kubitschek
SSA|Salvador|BA|Luís Eduardo Magalhães
REC|Recife|PE|Guararapes
FOR|Fortaleza|CE|Pinto Martins
NAT|Natal|RN|Governador Aluízio Alves
MCZ|Maceió|AL|Zumbi dos Palmares
AJU|Aracaju|SE|Santa Maria
JPA|João Pessoa|PB|Presidente Castro Pinto
SLZ|São Luís|MA|Marechal Cunha Machado
THE|Teresina|PI|Senador Petrônio Portella
BEL|Belém|PA|Val de Cans
MAO|Manaus|AM|Eduardo Gomes
MCP|Macapá|AP|Alberto Alcolumbre
BVB|Boa Vista|RR|Atlas Brasil Cantanhede
PVH|Porto Velho|RO|Governador Jorge Teixeira
RBR|Rio Branco|AC|Plácido de Castro
PMW|Palmas|TO|Brigadeiro Lysias Rodrigues
CGB|Cuiabá|MT|Marechal Rondon
CGR|Campo Grande|MS|Campo Grande
GYN|Goiânia|GO|Santa Genoveva
VIX|Vitória|ES|Eurico de Aguiar Salles
CWB|Curitiba|PR|Afonso Pena
IGU|Foz do Iguaçu|PR|Cataratas
LDB|Londrina|PR|Governador José Richa
MGF|Maringá|PR|Sílvio Name Júnior
FLN|Florianópolis|SC|Hercílio Luz
NVT|Navegantes|SC|Ministro Victor Konder
JOI|Joinville|SC|Lauro Carneiro de Loyola
POA|Porto Alegre|RS|Salgado Filho
CXJ|Caxias do Sul|RS|Hugo Cantergiani
BPS|Porto Seguro|BA|Porto Seguro
IOS|Ilhéus|BA|Jorge Amado
LEC|Lençóis|BA|Chapada Diamantina
VDC|Vitória da Conquista|BA|Pedro Otacílio Figueiredo
PNZ|Petrolina|PE|Senador Nilo Coelho
FEN|Fernando de Noronha|PE|Fernando de Noronha
JDO|Juazeiro do Norte|CE|Orlando Bezerra de Menezes
JJD|Jericoacoara|CE|Comandante Ariston Pessoa
IMP|Imperatriz|MA|Prefeito Renato Moreira
MAB|Marabá|PA|João Correa da Rocha
STM|Santarém|PA|Maestro Wilson Fonseca
UDI|Uberlândia|MG|Ten. Cel. Aviador César Bombonato
MOC|Montes Claros|MG|Mário Ribeiro
IPN|Ipatinga|MG|Usiminas
JDF|Juiz de Fora|MG|Francisco Álvares de Assis
RAO|Ribeirão Preto|SP|Leite Lopes
SJP|São José do Rio Preto|SP|Prof. Eribelto Manoel Reino
BAU|Bauru|SP|Bauru-Arealva
SJK|São José dos Campos|SP|Professor Urbano Ernesto Stumpf
SOD|Sorocaba|SP|Bertram Luiz Leupolz
CFB|Cabo Frio|RJ|Cabo Frio
BYO|Bonito|MS|Bonito
CMG|Corumbá|MS|Corumbá
DOU|Dourados|MS|Dourados
CAW|Campos dos Goytacazes|RJ|Bartolomeu Lysandro
BRC|Bariloche|Argentina|Teniente Luis Candelaria
EZE|Buenos Aires|Argentina|Ezeiza
AEP|Buenos Aires|Argentina|Aeroparque
COR|Córdoba|Argentina|Pajas Blancas
MDZ|Mendoza|Argentina|El Plumerillo
USH|Ushuaia|Argentina|Malvinas Argentinas
IGR|Puerto Iguazú|Argentina|Cataratas del Iguazú
SCL|Santiago|Chile|Arturo Merino Benítez
MVD|Montevidéu|Uruguai|Carrasco
PDP|Punta del Este|Uruguai|Laguna del Sauce
ASU|Assunção|Paraguai|Silvio Pettirossi
LPB|La Paz|Bolívia|El Alto
VVI|Santa Cruz de la Sierra|Bolívia|Viru Viru
LIM|Lima|Peru|Jorge Chávez
CUZ|Cusco|Peru|Alejandro Velasco Astete
BOG|Bogotá|Colômbia|El Dorado
MDE|Medellín|Colômbia|José María Córdova
CTG|Cartagena|Colômbia|Rafael Núñez
UIO|Quito|Equador|Mariscal Sucre
CCS|Caracas|Venezuela|Simón Bolívar
PTY|Cidade do Panamá|Panamá|Tocumen
SJO|San José|Costa Rica|Juan Santamaría
CUN|Cancún|México|Cancún
MEX|Cidade do México|México|Benito Juárez
PUJ|Punta Cana|República Dominicana|Punta Cana
HAV|Havana|Cuba|José Martí
AUA|Aruba|Aruba|Queen Beatrix
CUR|Curaçao|Curaçao|Hato
NAS|Nassau|Bahamas|Lynden Pindling
MIA|Miami|EUA|Miami
MCO|Orlando|EUA|Orlando
FLL|Fort Lauderdale|EUA|Fort Lauderdale-Hollywood
JFK|Nova York|EUA|John F. Kennedy
EWR|Nova York|EUA|Newark
LGA|Nova York|EUA|LaGuardia
BOS|Boston|EUA|Logan
IAD|Washington|EUA|Dulles
ATL|Atlanta|EUA|Hartsfield-Jackson
ORD|Chicago|EUA|O'Hare
DFW|Dallas|EUA|Dallas/Fort Worth
IAH|Houston|EUA|George Bush
LAX|Los Angeles|EUA|Los Angeles
SFO|São Francisco|EUA|São Francisco
LAS|Las Vegas|EUA|Harry Reid
SEA|Seattle|EUA|Seattle-Tacoma
YYZ|Toronto|Canadá|Pearson
YUL|Montreal|Canadá|Trudeau
YVR|Vancouver|Canadá|Vancouver
LIS|Lisboa|Portugal|Humberto Delgado
OPO|Porto|Portugal|Francisco Sá Carneiro
FAO|Faro|Portugal|Faro
MAD|Madri|Espanha|Barajas
BCN|Barcelona|Espanha|El Prat
CDG|Paris|França|Charles de Gaulle
ORY|Paris|França|Orly
LHR|Londres|Reino Unido|Heathrow
LGW|Londres|Reino Unido|Gatwick
DUB|Dublin|Irlanda|Dublin
AMS|Amsterdã|Países Baixos|Schiphol
BRU|Bruxelas|Bélgica|Bruxelas
FRA|Frankfurt|Alemanha|Frankfurt
MUC|Munique|Alemanha|Munique
ZRH|Zurique|Suíça|Zurique
FCO|Roma|Itália|Fiumicino
MXP|Milão|Itália|Malpensa
VCE|Veneza|Itália|Marco Polo
ATH|Atenas|Grécia|Eleftherios Venizelos
IST|Istambul|Turquia|Istambul
DXB|Dubai|Emirados Árabes|Dubai
DOH|Doha|Catar|Hamad
JNB|Joanesburgo|África do Sul|O.R. Tambo
CPT|Cidade do Cabo|África do Sul|Cidade do Cabo
LAD|Luanda|Angola|Quatro de Fevereiro
CAI|Cairo|Egito|Cairo
CMN|Casablanca|Marrocos|Mohammed V
NRT|Tóquio|Japão|Narita
HND|Tóquio|Japão|Haneda
ICN|Seul|Coreia do Sul|Incheon
BKK|Bangkok|Tailândia|Suvarnabhumi
SIN|Singapura|Singapura|Changi
SYD|Sydney|Austrália|Sydney
`.trim()

export const AIRPORTS: Airport[] = RAW.split('\n').map((l) => {
  const [iata, city, region, name] = l.split('|')
  return { iata, city, region, name }
})

export const airportByIata = (iata: string) => AIRPORTS.find((a) => a.iata === iata)
export const airportLabel = (a: Airport) => `${a.city} (${a.iata})`

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function processWords() {
  const path = join(root, "data/words.jsonl");
  const lines = readFileSync(path, "utf8").trimEnd().split("\n");
  const out = lines.map((line) => {
    const obj = JSON.parse(line);
    let level;
    if (obj.sl.includes(" ")) level = 3;
    else if (obj.cat === "pron" || obj.cat === "question") level = 1;
    else level = 2;
    return JSON.stringify({ ...obj, level });
  });
  writeFileSync(path, out.join("\n") + "\n");
  console.log(`words.jsonl: ${out.length} lines updated`);
}

function processExercises() {
  const path = join(root, "data/exercises.jsonl");
  const lines = readFileSync(path, "utf8").trimEnd().split("\n");
  const out = lines.map((line) => {
    const obj = JSON.parse(line);
    const n = obj.blanks.length;
    let level;
    if (n <= 6) level = "A2.1";
    else if (n <= 10) level = "A2.2";
    else level = "A2.3";
    return JSON.stringify({ ...obj, level });
  });
  writeFileSync(path, out.join("\n") + "\n");
  console.log(`exercises.jsonl: ${out.length} lines updated`);
}

// === ЯДРО ВЫЖИВАНИЯ (level 1): самые частотные слова A1 ===
// Список живёт в коде, поэтому переживает любой повторный запуск скрипта.
// Дополнять сюда по мере аудита частотности.
const CORE = new Set([
  // еда/напитки
  "voda","kava","čaj","kruh","mleko","sir","jajce","meso","riba","sadje","zelenjava",
  "sol","sladkor","pivo","vino","juha","solata","jabolko",
  // числа
  "ena","dve","tri","štiri","pet","šest","sedem","osem","devet","deset",
  // время/дни
  "danes","jutri","včeraj","zdaj","ura","dan","teden","mesec","leto","jutro","večer","noč",
  "ponedeljek","torek","sreda","četrtek","petek","sobota","nedelja",
  // прилагательные
  "dober","slab","velik","majhen","nov","star","lep","grd","vroč","mrzel","topel","hladen",
  "drag","poceni","težak","lahek","hiter","počasen","dolg","kratek",
  // семья/люди
  "mama","oče","sin","hči","brat","sestra","mož","žena","otrok","prijatelj","človek",
  "ženska","moški","fant","dekle",
  // места/быт
  "doma","hiša","stanovanje","soba","kuhinja","kopalnica","stranišče","trgovina","restavracija",
  "hotel","bolnišnica","lekarna","banka","pošta","postaja","letališče","ulica","mesto","vas",
  // вещи
  "denar","telefon","avto","vlak","avtobus","vrata","okno","miza","stol","postelja","ključ",
  "torba","obleka","čevlji","knjiga",
  // тело
  "glava","roka","noga","oko","uho","nos","usta","zob","trebuh","srce",
  // вежливость / да-нет / частотные наречия
  "da","ne","prosim","hvala","oprostite","dobro","slabo","veliko","malo","zelo",
  "tukaj","tam","tudi","samo",
  // погода
  "sonce","dež","sneg","veter","toplo","mraz",
]);

// === РЕДКИЕ / СПЕЦИФИЧНЫЕ слова (level 3): нечастотное, узкое, культурно-специфичное ===
// Сюда заносим только то, что осознанно хотим опустить в "редкое".
// CORE всегда побеждает RARE — если слово в обоих списках, выиграет CORE.
const RARE = new Set([
  // food
  "potica","narezek","lignji",
  // animal (insects, marine, exotic; common animals stay at level:2)
  "opica","metulj","pajek","tiger","podgana","petelin","gos","žuželka",
  "hrošč","komar","mravlja","kit","delfin","polž","volk","ovčka","kunec",
  // thing (specific accessories, materials, niche items)
  "telovnik","brezrokavnik","metuljček","naramnice","pentlja","medaljon",
  "žamet","čipka","poliester","lan","žerjav","vložek","pirat","vampir",
  "loterija","dekliščina","fantovščina","traparije",
  // place (narrow African countries for A1)
  "libija","alžirija","nigerija","kenija","maroko",
  // body (detailed/medical anatomy)
  "vretence","skelet","hrbtenica","rebra","mehur","vena","arterija",
  "tilnik","prstanec","sredinec","mezinec","guba","obrv","trepalnice",
  // time (rarely used time expressions)
  "predlani","rok",
  // school (narrow school items)
  "flomaster","projektor","kreda","letnik","izobrazba",
]);

function processLearn() {
  const path = join(root, "data/learn.jsonl");
  const lines = readFileSync(path, "utf8").trimEnd().split("\n");
  const out = lines.map((line) => {
    const obj = JSON.parse(line);
    const sl = obj.sl.toLowerCase();
    let level;
    if (CORE.has(sl)) level = 1;                          // ядро выживания — приоритет
    else if (obj.sl.includes(" ")) level = 3;             // фразы
    else if (RARE.has(sl)) level = 3;                     // редкое (чёрный список)
    else if (obj.cat === "pron" || obj.cat === "question") level = 1;  // местоимения/вопросы
    else level = 2;                                        // быт по умолчанию
    return JSON.stringify({ ...obj, level });
  });
  writeFileSync(path, out.join("\n") + "\n");
  console.log(`learn.jsonl: ${out.length} lines updated`);
}

processWords();
processExercises();
processLearn();

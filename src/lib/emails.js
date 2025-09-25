import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

export default function getTemplate(name, data) {
  const filePath = path.join(process.cwd(), "src", "emails", `${name}.html`);
  const templateSource = fs.readFileSync(filePath, "utf8");

  // Compila la plantilla con Handlebars
  const template = Handlebars.compile(templateSource);

  // Devuelve el HTML renderizado con los datos
  return template(data);
}

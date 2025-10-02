import fs from "fs";
import path from "path";
import Mustache from "mustache";

export default function getTemplate(name, data) {
  const filePath = path.join(process.cwd(), "src", "emails", `${name}.html`);
  const templateSource = fs.readFileSync(filePath, "utf8");

  // Renderiza la plantilla con Mustache
  return Mustache.render(templateSource, data);
}

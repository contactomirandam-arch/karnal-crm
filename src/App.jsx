import React, { useState, useEffect } from "react";

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl shadow p-3">{children}</div>
);

const Button = ({ children, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled} className="bg-black text-white px-3 py-1 rounded-xl text-sm disabled:opacity-50">
    {children}
  </button>
);

const AGENTES = Array.from({ length: 15 }, (_, i) => `agente${i + 1}`);

export default function App() {
  const [logged, setLogged] = useState(false);
  const [form, setForm] = useState({ user: "", pass: "" });
  const [user, setUser] = useState(null);

  const [leads, setLeads] = useState([]);
  const [contadorAsignacion, setContadorAsignacion] = useState(0);
  const [loading, setLoading] = useState(false);

  const [nuevoLead, setNuevoLead] = useState({ nombre: "", telefono: "" });

  const [leadActivo, setLeadActivo] = useState(null);
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("leads");
    if (data) setLeads(JSON.parse(data));
  }, []);

  useEffect(() => {
    localStorage.setItem("leads", JSON.stringify(leads));
  }, [leads]);

  const login = () => {
    setLogged(true);
    setUser({ user: form.user });
  };

  const asignarAutomatico = () => {
    const agente = AGENTES[contadorAsignacion % AGENTES.length];
    setContadorAsignacion((prev) => prev + 1);
    return agente;
  };

  const addLead = async () => {
    if (!nuevoLead.nombre || loading) return;

    setLoading(true);

    const nuevo = {
      id: Date.now(),
      ...nuevoLead,
      estado: "Nuevo",
      asesor: asignarAutomatico(),
      comentarios: [],
      fecha: new Date().toISOString()
    };

    try {
      await fetch("https://n8n-ekxc.onrender.com/webhook/nuevo-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevo)
      });
    } catch (error) {
      console.error("Error enviando a n8n", error);
    }

    setLeads((prev) => [...prev, nuevo]);
    setNuevoLead({ nombre: "", telefono: "" });
    setLoading(false);
  };

  const moverLead = (id, estado) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, estado } : l))
    );
  };

  const agregarComentario = () => {
    if (!comentario || leadActivo === null) return;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadActivo
          ? {
              ...l,
              comentarios: [
                ...l.comentarios,
                {
                  texto: comentario,
                  fecha: new Date().toLocaleString(),
                  user: user.user
                }
              ]
            }
          : l
      )
    );

    setComentario("");
  };

  const asignarManual = (id, agente) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, asesor: agente } : l))
    );
  };

  if (!logged) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <Card>
          <h2 className="mb-3">Kanal CRM</h2>
          <input placeholder="Usuario" className="border p-2 mb-2 w-full" onChange={(e) => setForm({ ...form, user: e.target.value })} />
          <input placeholder="Clave" type="password" className="border p-2 mb-2 w-full" onChange={(e) => setForm({ ...form, pass: e.target.value })} />
          <Button onClick={login}>Entrar</Button>
        </Card>
      </div>
    );
  }

  const columnas = ["Nuevo", "Contactado", "Seguimiento", "Negociación", "Cerrado"];

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-xl mb-4">Kanal CRM PRO</h1>

      <Card>
        <h2 className="mb-2">Nuevo Lead</h2>
        <input placeholder="Nombre" className="border p-2 mr-2" value={nuevoLead.nombre} onChange={(e) => setNuevoLead({ ...nuevoLead, nombre: e.target.value })} />
        <input placeholder="Teléfono" className="border p-2 mr-2" value={nuevoLead.telefono} onChange={(e) => setNuevoLead({ ...nuevoLead, telefono: e.target.value })} />
        <Button onClick={addLead} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
      </Card>

      <div className="flex gap-3 mt-4 overflow-x-auto">
        {columnas.map((col) => (
          <div key={col} className="min-w-[250px]">
            <h3 className="text-center mb-2">{col}</h3>
            {leads
              .filter((l) => l.estado === col)
              .map((l) => (
                <Card key={l.id}>
                  <p className="font-bold">{l.nombre}</p>
                  <p className="text-sm">{l.telefono}</p>
                  <p className="text-xs">Asesor: {l.asesor}</p>

                  <select
                    className="border text-xs mt-1"
                    value={l.asesor}
                    onChange={(e) => asignarManual(l.id, e.target.value)}
                  >
                    {AGENTES.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {columnas.map((c) => (
                      <button key={c} onClick={() => moverLead(l.id, c)} className="text-xs border px-1">
                        {c}
                      </button>
                    ))}
                  </div>

                  <Button onClick={() => setLeadActivo(l.id)}>Ver</Button>
                </Card>
              ))}
          </div>
        ))}
      </div>

      {leadActivo !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl w-96">
            <h2 className="mb-2">Detalle Lead</h2>

            {(() => {
              const lead = leads.find((l) => l.id === leadActivo);
              if (!lead) return null;

              return (
                <>
                  <p><b>{lead.nombre}</b></p>
                  <p>{lead.telefono}</p>

                  <h3 className="mt-3">Comentarios</h3>
                  <div className="max-h-40 overflow-y-auto">
                    {lead.comentarios.map((c, i) => (
                      <div key={i} className="border p-1 mb-1 text-xs">
                        <b>{c.user}</b>: {c.texto}
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}

            <input
              placeholder="Escribir comentario"
              className="border p-2 w-full mt-2"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />

            <div className="flex justify-between mt-2">
              <Button onClick={agregarComentario}>Agregar</Button>
              <Button onClick={() => setLeadActivo(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

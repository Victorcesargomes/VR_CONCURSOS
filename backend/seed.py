from datetime import datetime, timedelta
from database import engine, Base, SessionLocal
from models import Materia, Assunto, Topico, PlanoSemanal, SessaoEstudo, Prioridade
import random

Base.metadata.create_all(bind=engine)

db = SessionLocal()

if db.query(Materia).first():
    print("Banco já possui dados. Pulando seed.")
    db.close()
    exit()

materias_data = [
    ("Direito Constitucional", "Constituição Federal e princípios fundamentais"),
    ("Direito Administrativo", "Regime jurídico, atos e contratos administrativos"),
    ("Português", "Interpretação de texto, gramática e redação oficial"),
    ("Raciocínio Lógico", "Lógica proposicional, conjuntos e análise combinatória"),
    ("Informática", "Sistemas operacionais, pacote Office e segurança"),
    ("Matemática Financeira", "Juros simples, compostos e análise de investimentos"),
    ("Direito Penal", "Crimes, penas e processo penal"),
    ("Contabilidade Geral", "Demonstrações contábeis e princípios fundamentais"),
]

assuntos_map = {
    "Direito Constitucional": [
        "Princípios Fundamentais",
        "Direitos e Garantias Fundamentais",
        "Organização do Estado",
        "Poderes e Controle de Constitucionalidade",
    ],
    "Direito Administrativo": [
        "Atos Administrativos",
        "Licitações e Contratos",
        "Servidores Públicos",
        "Responsabilidade Civil do Estado",
    ],
    "Português": [
        "Interpretação de Texto",
        "Gramática",
        "Redação Oficial",
    ],
    "Raciocínio Lógico": [
        "Lógica Proposicional",
        "Argumentação",
        "Análise Combinatória e Probabilidade",
    ],
    "Informática": [
        "Sistemas Operacionais",
        "Pacote Office",
        "Segurança da Informação",
    ],
    "Matemática Financeira": [
        "Juros Simples e Compostos",
        "Taxas e Descontos",
        "Sistemas de Amortização",
    ],
    "Direito Penal": [
        "Teoria do Crime",
        "Penas e Medidas",
        "Crimes em Espécie",
    ],
    "Contabilidade Geral": [
        "Demonstrações Contábeis",
        "Princípios Contábeis",
        "Análise de Balanços",
    ],
}

topicos_map = {
    "Princípios Fundamentais": [
        ("Fundamentos da República", Prioridade.alta, 5),
        ("Objetivos Fundamentais", Prioridade.alta, 4),
        ("Princípios das Relações Internacionais", Prioridade.media, 3),
    ],
    "Direitos e Garantias Fundamentais": [
        ("Direitos Individuais e Coletivos", Prioridade.alta, 5),
        ("Remédios Constitucionais", Prioridade.alta, 5),
        ("Direitos Sociais", Prioridade.media, 3),
    ],
    "Organização do Estado": [
        ("Organização Político-Administrativa", Prioridade.media, 3),
        ("Repartição de Competências", Prioridade.media, 3),
    ],
    "Poderes e Controle de Constitucionalidade": [
        ("Poder Legislativo", Prioridade.alta, 4),
        ("Poder Executivo e Judiciário", Prioridade.alta, 4),
        ("Controle de Constitucionalidade", Prioridade.alta, 5),
    ],
    "Atos Administrativos": [
        ("Elementos e Atributos", Prioridade.alta, 5),
        ("Classificação e Espécies", Prioridade.media, 4),
        ("Anulação e Revogação", Prioridade.media, 3),
    ],
    "Licitações e Contratos": [
        ("Modalidades de Licitação", Prioridade.alta, 5),
        ("Contratos Administrativos", Prioridade.alta, 4),
    ],
    "Servidores Públicos": [
        ("Regime Jurídico", Prioridade.alta, 4),
        ("Direitos e Deveres", Prioridade.media, 3),
    ],
    "Responsabilidade Civil do Estado": [
        ("Teoria do Risco Administrativo", Prioridade.alta, 4),
        ("Excludentes de Responsabilidade", Prioridade.media, 3),
    ],
    "Interpretação de Texto": [
        ("Compreensão Textual", Prioridade.alta, 5),
        ("Tipologia Textual", Prioridade.media, 4),
    ],
    "Gramática": [
        ("Concordância Verbal e Nominal", Prioridade.alta, 4),
        ("Regência e Crase", Prioridade.alta, 4),
        ("Pontuação", Prioridade.media, 3),
    ],
    "Redação Oficial": [
        ("Padrão Ofício", Prioridade.media, 3),
        ("Pronomes de Tratamento", Prioridade.baixa, 2),
    ],
    "Lógica Proposicional": [
        ("Proposições e Conectivos", Prioridade.alta, 4),
        ("Tabelas-Verdade", Prioridade.alta, 4),
    ],
    "Argumentação": [
        ("Argumentos Dedutivos", Prioridade.media, 3),
        ("Falácias", Prioridade.baixa, 2),
    ],
    "Análise Combinatória e Probabilidade": [
        ("Princípios de Contagem", Prioridade.media, 3),
        ("Probabilidade Condicional", Prioridade.media, 3),
    ],
    "Sistemas Operacionais": [
        ("Windows", Prioridade.alta, 3),
        ("Linux", Prioridade.baixa, 2),
    ],
    "Pacote Office": [
        ("Word", Prioridade.alta, 4),
        ("Excel", Prioridade.alta, 5),
        ("PowerPoint", Prioridade.baixa, 2),
    ],
    "Segurança da Informação": [
        ("Malware e Ataques", Prioridade.alta, 4),
        ("Criptografia", Prioridade.media, 3),
    ],
    "Juros Simples e Compostos": [
        ("Juros Simples", Prioridade.alta, 4),
        ("Juros Compostos", Prioridade.alta, 5),
    ],
    "Taxas e Descontos": [
        ("Taxas Equivalentes", Prioridade.media, 3),
        ("Descontos Simples", Prioridade.media, 3),
    ],
    "Sistemas de Amortização": [
        ("SAC", Prioridade.media, 3),
        ("PRICE", Prioridade.media, 3),
    ],
    "Teoria do Crime": [
        ("Tipo Penal", Prioridade.alta, 5),
        ("Ilicitude e Culpabilidade", Prioridade.alta, 4),
    ],
    "Penas e Medidas": [
        ("Espécies de Pena", Prioridade.media, 3),
        ("Regimes de Cumprimento", Prioridade.media, 3),
    ],
    "Crimes em Espécie": [
        ("Crimes contra a Pessoa", Prioridade.alta, 4),
        ("Crimes contra o Patrimônio", Prioridade.alta, 4),
    ],
    "Demonstrações Contábeis": [
        ("Balanço Patrimonial", Prioridade.alta, 5),
        ("DRE", Prioridade.alta, 4),
    ],
    "Princípios Contábeis": [
        ("Princípios Fundamentais", Prioridade.media, 3),
        ("Convenções Contábeis", Prioridade.baixa, 2),
    ],
    "Análise de Balanços": [
        ("Índices de Liquidez", Prioridade.alta, 4),
        ("Índices de Rentabilidade", Prioridade.media, 3),
    ],
}

# Create materias
materias = {}
for nome, desc in materias_data:
    m = Materia(nome=nome, descricao=desc)
    db.add(m)
    db.flush()
    materias[nome] = m

# Create assuntos and topicos
all_assuntos = {}
all_topicos = []

for mat_nome, assuntos_nomes in assuntos_map.items():
    mat = materias[mat_nome]
    for a_nome in assuntos_nomes:
        a = Assunto(materia_id=mat.id, nome=a_nome)
        db.add(a)
        db.flush()
        all_assuntos[a_nome] = a

        if a_nome in topicos_map:
            for t_nome, t_prio, t_peso in topicos_map[a_nome]:
                t = Topico(assunto_id=a.id, nome=t_nome, prioridade=t_prio, peso=t_peso)
                db.add(t)
                db.flush()
                all_topicos.append(t)

# Seed study sessions (45 days of data)
random.seed(42)
hoje = datetime.utcnow()

for _ in range(400):
    t = random.choice(all_topicos)
    dias_atras = random.randint(0, 45)
    data = hoje - timedelta(days=dias_atras, hours=random.randint(0, 12))
    peso = t.peso or 1
    questoes = random.randint(5, 30)
    taxa_acerto = random.uniform(0.35, 0.9)
    acertos = int(questoes * taxa_acerto)
    erros = questoes - acertos
    s = SessaoEstudo(
        topico_id=t.id,
        data=data,
        questoes_feitas=questoes,
        acertos=acertos,
        erros=erros,
        observacoes=random.choice([None, None, "Revisar", "Conteúdo dominado", "Precisa de mais atenção"]),
        resumo_feito=random.choice([True, False, False]),
    )
    db.add(s)

# Weekly plan
plano = [
    (0, "Interpretação de Texto", 120),
    (0, "Princípios Fundamentais", 90),
    (1, "Gramática", 90),
    (1, "Juros Simples e Compostos", 60),
    (2, "Direitos e Garantias Fundamentais", 120),
    (2, "Atos Administrativos", 90),
    (3, "Demonstrações Contábeis", 90),
    (3, "Teoria do Crime", 60),
    (4, "Pacote Office", 60),
    (4, "Lógica Proposicional", 90),
    (5, "Licitações e Contratos", 120),
]

for dia, assunto_nome, minutos in plano:
    a = all_assuntos.get(assunto_nome)
    if a:
        tipo = "resumo" if dia >= 4 else "estudo"
        p = PlanoSemanal(dia_semana=dia, assunto_id=a.id, tempo_minutos=minutos, tipo=tipo)
        db.add(p)

db.commit()
db.close()

print("Seed concluído!")
print(f"  - {len(materias_data)} matérias")
print(f"  - {len(all_assuntos)} assuntos")
print(f"  - {len(all_topicos)} tópicos")
print(f"  - 400 sessões de estudo")
print(f"  - Plano semanal com {len(plano)} entradas")

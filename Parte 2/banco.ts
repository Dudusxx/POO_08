class AplicacaoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AplicacaoError";
  }
}

class ContaInexistenteError extends AplicacaoError {
  constructor(message: string) {
    super(message);
    this.name = "ContaInexistenteError";
  }
}

class ClienteNaoEncontradoError extends AplicacaoError {
  constructor(message: string) {
    super(message);
    this.name = "ClienteNaoEncontradoError";
  }
}

class SaldoInsuficienteError extends AplicacaoError {
  constructor(message: string) {
    super(message);
    this.name = "SaldoInsuficienteError";
  }
}

class ValorInvalidoError extends AplicacaoError {
  constructor(message: string) {
    super(message);
    this.name = "ValorInvalidoError";
  }
}

class PoupancaInvalidaError extends AplicacaoError {
  constructor(message: string) {
    super(message);
    this.name = "PoupancaInvalidaError";
  }
}

class Cliente {
  public readonly nome: string;
  public readonly cpf: string;
  public readonly dataNascimento: Date;

  constructor(nome: string, cpf: string, dataNascimento: Date) {
    if (!nome || nome.trim() === "") {
      throw new ValorInvalidoError("Nome não pode estar em branco.");
    }
    if (!Cliente.validarCPF(cpf)) {
      throw new ValorInvalidoError("O formato do CPF fornecido é inválido.");
    }
    if (!Cliente.validarDataNascimento(dataNascimento)) {
      throw new ValorInvalidoError("A data de nascimento não pode estar no futuro.");
    }
    this.nome = nome;
    this.cpf = cpf;
    this.dataNascimento = dataNascimento;
  }

  static validarCPF(cpf: string): boolean {
    const cpfLimpo = cpf.replace(/\D/g, "");
    return cpfLimpo.length === 11;
  }

  static validarDataNascimento(data: Date): boolean {
    return data < new Date();
  }
}

abstract class Conta {
  protected _saldo: number = 0;
  public readonly numero: string;
  public readonly cliente: Cliente;

  constructor(numero: string, cliente: Cliente, saldoInicial: number = 0) {
    this.numero = numero;
    this.cliente = cliente;
    
    if (saldoInicial > 0) {
      this.depositar(saldoInicial);
    }
  }

  get saldo(): number {
    return this._saldo;
  }

  public depositar(valor: number): void {
    this._saldo += valor;
  }

  public sacar(valor: number): void {
    if (valor > this._saldo) {
      throw new SaldoInsuficienteError("Saldo atual não suporta esta retirada.");
    }
    this._saldo -= valor;
  }
}

class ContaCorrente extends Conta {
}

class ContaPoupanca extends Conta {
  public renderJuros(taxa: number): void {
    if (taxa <= 0) {
      throw new ValorInvalidoError("Para render juros, a taxa requerida deve ser positiva.");
    }
    
    this._saldo += this._saldo * (taxa / 100);
  }
}

class Banco {
  private contas: Conta[] = [];
  private clientes: Cliente[] = [];

  public consultar(numero: string): Conta {
    for (let i = 0; i < this.contas.length; i++) {
      if (this.contas[i].numero === numero) {
        return this.contas[i];
      }
    }
    throw new ContaInexistenteError(`A conta de número ${numero} não está nos registros.`);
  }

  public consultarPorIndice(numero: string): number {
    for (let i = 0; i < this.contas.length; i++) {
      if (this.contas[i].numero === numero) {
        return i;
      }
    }
    throw new ContaInexistenteError(`A conta de número ${numero} não está nos registros.`);
  }

  public consultarCliente(cpf: string): Cliente {
    for (let i = 0; i < this.clientes.length; i++) {
      if (this.clientes[i].cpf === cpf) {
        return this.clientes[i];
      }
    }
    throw new ClienteNaoEncontradoError(`Documento CPF ${cpf} não vinculado a nenhum cliente.`);
  }

  public consultarClientePorIndice(cpf: string): number {
    for (let i = 0; i < this.clientes.length; i++) {
      if (this.clientes[i].cpf === cpf) {
        return i;
      }
    }
    throw new ClienteNaoEncontradoError(`Documento CPF ${cpf} não vinculado a nenhum cliente.`);
  }

  public adicionarCliente(cliente: Cliente): void {
    for (let i = 0; i < this.clientes.length; i++) {
      if (this.clientes[i].cpf === cliente.cpf) {
        throw new AplicacaoError(`Conflito: Cliente com CPF ${cliente.cpf} já cadastrado.`);
      }
    }
    this.clientes.push(cliente);
  }

  public adicionarConta(conta: Conta): void {
    for (let i = 0; i < this.contas.length; i++) {
      if (this.contas[i].numero === conta.numero) {
        throw new AplicacaoError(`Conflito: O número de conta ${conta.numero} já está em uso.`);
      }
    }
    
    for (let i = 0; i < this.contas.length; i++) {
      if (this.contas[i].cliente.cpf === conta.cliente.cpf) {
        throw new AplicacaoError(`Restrição: O cliente (CPF: ${conta.cliente.cpf}) já detém uma conta ativa.`);
      }
    }
    this.contas.push(conta);
  }

  public alterarConta(conta: Conta): void {
    const indice = this.consultarPorIndice(conta.numero);
    this.contas[indice] = conta;
  }

  public depositar(numero: string, valor: number): void {
    const conta = this.consultar(numero);
    conta.depositar(valor);
  }

  public sacar(numero: string, valor: number): void {
    const conta = this.consultar(numero);
    conta.sacar(valor);
  }

  public transferir(origem: string, destino: string, valor: number): void {
    const contaOrigem = this.consultar(origem);
    const contaDestino = this.consultar(destino);
    
    contaOrigem.sacar(valor);
    contaDestino.depositar(valor);
  }

  public renderJuros(numero: string, taxa: number): void {
    const conta = this.consultar(numero);
    
    if (!(conta instanceof ContaPoupanca)) {
      throw new PoupancaInvalidaError("Tentativa falha: Esta modalidade de conta não rende juros.");
    }
    (conta as ContaPoupanca).renderJuros(taxa);
  }
}

class App {
  private banco: Banco;

  constructor(banco: Banco) {
    this.banco = banco;
  }

  private validarValorEntrada(valor: number): void {
    if (valor === null || valor === undefined || isNaN(valor) || valor <= 0) {
      throw new ValorInvalidoError("Aporte negado: O valor estipulado precisa ser um número real positivo.");
    }
  }

  private depositar(numero: string, valor: number): void {
    this.validarValorEntrada(valor);
    this.banco.depositar(numero, valor);
  }

  private sacar(numero: string, valor: number): void {
    this.validarValorEntrada(valor);
    this.banco.sacar(numero, valor);
  }

  private transferir(origem: string, destino: string, valor: number): void {
    this.validarValorEntrada(valor);
    this.banco.transferir(origem, destino, valor);
  }

  public executar(): void {
    try {
      const cliente1 = new Cliente("João Silva", "12345678901", new Date(1990, 5, 15));
      this.banco.adicionarCliente(cliente1);

      this.validarValorEntrada(100);
      const conta1 = new ContaCorrente("001", cliente1, 100);
      this.banco.adicionarConta(conta1);

      this.depositar("001", 50);
      console.log(`Balanço pós-depósito: ${this.banco.consultar("001").saldo}`);

      this.sacar("001", 20);
      console.log(`Balanço pós-saque: ${this.banco.consultar("001").saldo}`);

      this.transferir("001", "001", 10);
      console.log(`Balanço pós-transferência: ${this.banco.consultar("001").saldo}`);

      try {
        this.banco.renderJuros("001", 2);
      } catch (e) {
        if (e instanceof PoupancaInvalidaError) {
          console.warn("Aviso de juros:", e.message);
        } else {
          throw e; 
        }
      }

      const cliente2 = new Cliente("Maria Oliveira", "98765432100", new Date(1985, 10, 20));
      this.banco.adicionarCliente(cliente2);

      this.validarValorEntrada(200);
      const contaPoupanca = new ContaPoupanca("002", cliente2, 200);
      this.banco.adicionarConta(contaPoupanca);

      this.banco.renderJuros("002", 3);
      console.log(`Extrato da poupança (juros incluídos): ${this.banco.consultar("002").saldo}`);

      try {
        this.depositar("001", -10);
      } catch (e) {
        if (e instanceof ValorInvalidoError) {
          console.warn("Entrada recusada:", e.message);
        } else {
          throw e;
        }
      }
    } catch (error) {
      if (error instanceof AplicacaoError) {
        console.error("Falha de Negócio:", error.message);
      } else {
        console.error("Crash Inesperado:", error);
      }
    }
  }
}

const banco = new Banco();
const app = new App(banco);
app.executar();

export {};

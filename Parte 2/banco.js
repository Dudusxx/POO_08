class AplicacaoError extends Error {
    constructor(message) {
        super(message);
        this.name = "AplicacaoError";
    }
}
class ContaInexistenteError extends AplicacaoError {
    constructor(message) {
        super(message);
        this.name = "ContaInexistenteError";
    }
}
class ClienteNaoEncontradoError extends AplicacaoError {
    constructor(message) {
        super(message);
        this.name = "ClienteNaoEncontradoError";
    }
}
class SaldoInsuficienteError extends AplicacaoError {
    constructor(message) {
        super(message);
        this.name = "SaldoInsuficienteError";
    }
}
class ValorInvalidoError extends AplicacaoError {
    constructor(message) {
        super(message);
        this.name = "ValorInvalidoError";
    }
}
class PoupancaInvalidaError extends AplicacaoError {
    constructor(message) {
        super(message);
        this.name = "PoupancaInvalidaError";
    }
}

class Cliente {
    constructor(nome, cpf, dataNascimento) {
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
    
    static validarCPF(cpf) {
        const cpfLimpo = cpf.replace(/\D/g, "");
        return cpfLimpo.length === 11;
    }
    
    static validarDataNascimento(data) {
        return data < new Date();
    }
}

class Conta {
    constructor(numero, cliente, saldoInicial = 0) {
        this._saldo = 0;
        this.numero = numero;
        this.cliente = cliente;
        
        if (saldoInicial > 0) {
            this.depositar(saldoInicial);
        }
    }
    get saldo() {
        return this._saldo;
    }
    depositar(valor) {
        this._saldo += valor;
    }
    sacar(valor) {
        if (valor > this._saldo) {
            throw new SaldoInsuficienteError("Saldo atual não suporta esta retirada.");
        }
        this._saldo -= valor;
    }
}

class ContaCorrente extends Conta {
}

class ContaPoupanca extends Conta {
    renderJuros(taxa) {
        if (taxa <= 0) {
            throw new ValorInvalidoError("Para render juros, a taxa requerida deve ser positiva.");
        }
        this._saldo += this._saldo * (taxa / 100);
    }
}

class Banco {
    constructor() {
        this.contas = [];
        this.clientes = [];
    }
    
    consultar(numero) {
        for (let i = 0; i < this.contas.length; i++) {
            if (this.contas[i].numero === numero) {
                return this.contas[i];
            }
        }
        throw new ContaInexistenteError(`A conta de número ${numero} não está nos registros.`);
    }
    
    consultarPorIndice(numero) {
        for (let i = 0; i < this.contas.length; i++) {
            if (this.contas[i].numero === numero) {
                return i;
            }
        }
        throw new ContaInexistenteError(`A conta de número ${numero} não está nos registros.`);
    }
    
    consultarCliente(cpf) {
        for (let i = 0; i < this.clientes.length; i++) {
            if (this.clientes[i].cpf === cpf) {
                return this.clientes[i];
            }
        }
        throw new ClienteNaoEncontradoError(`Documento CPF ${cpf} não vinculado a nenhum cliente.`);
    }
    
    consultarClientePorIndice(cpf) {
        for (let i = 0; i < this.clientes.length; i++) {
            if (this.clientes[i].cpf === cpf) {
                return i;
            }
        }
        throw new ClienteNaoEncontradoError(`Documento CPF ${cpf} não vinculado a nenhum cliente.`);
    }
    
    adicionarCliente(cliente) {
        for (let i = 0; i < this.clientes.length; i++) {
            if (this.clientes[i].cpf === cliente.cpf) {
                throw new AplicacaoError(`Conflito: Cliente com CPF ${cliente.cpf} já cadastrado.`);
            }
        }
        this.clientes.push(cliente);
    }
    
    adicionarConta(conta) {
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
    
    alterarConta(conta) {
        const indice = this.consultarPorIndice(conta.numero);
        this.contas[indice] = conta;
    }
    
    depositar(numero, valor) {
        const conta = this.consultar(numero);
        conta.depositar(valor);
    }
    
    sacar(numero, valor) {
        const conta = this.consultar(numero);
        conta.sacar(valor);
    }
    
    transferir(origem, destino, valor) {
        const contaOrigem = this.consultar(origem);
        const contaDestino = this.consultar(destino);
        contaOrigem.sacar(valor);
        contaDestino.depositar(valor);
    }
    
    renderJuros(numero, taxa) {
        const conta = this.consultar(numero);
        if (!(conta instanceof ContaPoupanca)) {
            throw new PoupancaInvalidaError("Tentativa falha: Esta modalidade de conta não rende juros.");
        }
        conta.renderJuros(taxa);
    }
}

class App {
    constructor(banco) {
        this.banco = banco;
    }
    
    validarValorEntrada(valor) {
        if (valor === null || valor === undefined || isNaN(valor) || valor <= 0) {
            throw new ValorInvalidoError("Aporte negado: O valor estipulado precisa ser um número real positivo.");
        }
    }
    
    depositar(numero, valor) {
        this.validarValorEntrada(valor);
        this.banco.depositar(numero, valor);
    }
    
    sacar(numero, valor) {
        this.validarValorEntrada(valor);
        this.banco.sacar(numero, valor);
    }
    
    transferir(origem, destino, valor) {
        this.validarValorEntrada(valor);
        this.banco.transferir(origem, destino, valor);
    }
    
    executar() {
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
            }
            catch (e) {
                if (e instanceof PoupancaInvalidaError) {
                    console.warn("Aviso de juros:", e.message);
                }
                else {
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
            }
            catch (e) {
                if (e instanceof ValorInvalidoError) {
                    console.warn("Entrada recusada:", e.message);
                }
                else {
                    throw e;
                }
            }
        }
        catch (error) {
            if (error instanceof AplicacaoError) {
                console.error("Falha de Negócio:", error.message);
            }
            else {
                console.error("Crash Inesperado:", error);
            }
        }
    }
}

const banco = new Banco();
const app = new App(banco);
app.executar();
export {};

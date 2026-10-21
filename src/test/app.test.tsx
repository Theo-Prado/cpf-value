import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';

/** WebGL nao existe no jsdom; a cena 3D deve cair no fallback CSS. */
function mockWebglUnavailable(): void {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
}

afterEach(() => {
  window.localStorage.clear();
});

describe('App', () => {
  it('renderiza o cabecalho e o campo de CPF', () => {
    mockWebglUnavailable();

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Cartório Digital de CPF' })).toBeInTheDocument();
    expect(screen.getByLabelText('CPF')).toBeInTheDocument();
  });

  it('comeca no estado vazio, sem carimbo visivel', () => {
    mockWebglUnavailable();

    render(<App />);

    expect(screen.getByTestId('verdict-title')).toHaveTextContent('Aguardando o CPF');
    expect(screen.getByTestId('stamp')).toHaveAttribute('data-status', 'EMPTY');
  });

  it('aplica a mascara progressiva enquanto o usuario digita', async () => {
    mockWebglUnavailable();

    const user = userEvent.setup();

    render(<App />);

    const input = screen.getByLabelText('CPF');

    await user.type(input, '52998224725');

    expect(input).toHaveValue('529.982.247-25');
  });

  it('valida um CPF correto e mostra o veredito de conformidade', async () => {
    mockWebglUnavailable();

    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText('CPF'), '52998224725');

    await waitFor(() => {
      expect(screen.getByTestId('verdict-title')).toHaveTextContent('CPF matematicamente válido');
    });

    expect(screen.getByTestId('stamp')).toHaveAttribute('data-status', 'VALID');
    expect(screen.getByTestId('verdict-reason')).toHaveTextContent(
      'Os dígitos verificadores conferem.',
    );
  });

  it('rejeita um CPF com digito verificador incorreto', async () => {
    mockWebglUnavailable();

    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText('CPF'), '52998224726');

    await waitFor(() => {
      expect(screen.getByTestId('verdict-title')).toHaveTextContent('CPF não conforme');
    });

    expect(screen.getByTestId('stamp')).toHaveAttribute('data-status', 'INVALID_DV2');
  });

  it('classifica um CPF sequencial como sem emissao', async () => {
    mockWebglUnavailable();

    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText('CPF'), '12345678909');

    await waitFor(() => {
      expect(screen.getByTestId('verdict-title')).toHaveTextContent('CPF sem emissão');
    });
  });

  it('anuncia o resultado na regiao viva', async () => {
    mockWebglUnavailable();

    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText('CPF'), '52998224725');

    await waitFor(() => {
      expect(screen.getByTestId('live-region')).toHaveTextContent(
        'CPF matematicamente válido: os dígitos verificadores conferem.',
      );
    });
  });

  it('limpa o campo com o botao de limpeza', async () => {
    mockWebglUnavailable();

    const user = userEvent.setup();

    render(<App />);

    const input = screen.getByLabelText('CPF');

    await user.type(input, '52998224725');
    await user.click(screen.getByRole('button', { name: 'Limpar o CPF digitado' }));

    expect(input).toHaveValue('');
    expect(screen.getByTestId('verdict-title')).toHaveTextContent('Aguardando o CPF');
  });

  it('preenche o campo a partir de uma amostra', async () => {
    mockWebglUnavailable();

    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /Válido · 529\.982\.247-25/ }));

    expect(screen.getByLabelText('CPF')).toHaveValue('529.982.247-25');
  });

  it('revele o detalhamento do calculo apenas quando ha digitos verificadores', async () => {
    mockWebglUnavailable();

    const user = userEvent.setup();

    render(<App />);

    expect(screen.queryByTestId('rule-breakdown')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('CPF'), '52998224725');

    await waitFor(() => {
      expect(screen.getByTestId('rule-breakdown')).toBeInTheDocument();
    });
  });

  it('expõe o documento e o carimbo com semantica acessivel', async () => {
    mockWebglUnavailable();

    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText('CPF'), '52998224725');

    await waitFor(() => {
      expect(screen.getByRole('img', { name: /CPF matematicamente válido/i })).toBeInTheDocument();
    });
  });

  it('nunca persiste o CPF digitado (SDD 18.1)', async () => {
    mockWebglUnavailable();

    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText('CPF'), '52998224725');

    await waitFor(() => {
      expect(screen.getByTestId('verdict-title')).toHaveTextContent('CPF matematicamente válido');
    });

    const stored = Object.keys(window.localStorage)
      .map((key) => `${key}=${window.localStorage.getItem(key) ?? ''}`)
      .join('&');

    expect(stored).not.toContain('529');
    expect(stored).not.toContain('982');
    expect(stored).not.toContain('247');
  });

  it('nao faz nenhuma requisicao de rede durante a digitacao', async () => {
    mockWebglUnavailable();

    const fetchSpy = vi.fn();
    const originalFetch = globalThis.fetch;

    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    try {
      const user = userEvent.setup();

      render(<App />);

      await user.type(screen.getByLabelText('CPF'), '52998224725');

      await waitFor(() => {
        expect(screen.getByTestId('verdict-title')).toHaveTextContent('CPF matematicamente válido');
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

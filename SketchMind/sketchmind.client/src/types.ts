export interface Message {
    text: string;
    type: 'user' | 'bot';
}

export interface Drawing {
    id: number;
    name: string;
    htmlContent: string;
}
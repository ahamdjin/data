"use client";

import { ChatRequestOptions } from "ai";
import { AnimatePresence } from "framer-motion";
import { ArrowUp, CornerDownLeft, Square } from "lucide-react";
import React, { useEffect } from "react";
import { Button } from "../ui/button";
import { ChatInput } from "../ui/chat/chat-input";

interface ChatBottombarProps {
	handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	handleSubmit: (
		e: React.FormEvent<HTMLFormElement>,
		chatRequestOptions?: ChatRequestOptions
	) => void;
	isLoading: boolean;
	stop: () => void;
	setInput?: React.Dispatch<React.SetStateAction<string>>;
	input: string;
	isToolInProgress: boolean;
	isMiddle: boolean;
}

export default function ChatBottombar({
	input,
	handleInputChange,
	handleSubmit,
	isLoading,
	stop,
	setInput,
	isToolInProgress,
	isMiddle,
}: ChatBottombarProps) {
	const inputRef = React.useRef<HTMLTextAreaElement>(null);

	const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (
			e.key === "Enter" &&
			!e.shiftKey &&
			!e.nativeEvent.isComposing &&
			!isToolInProgress &&
			input.trim()
		) {
			e.preventDefault();
			handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
		}
	};

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, [inputRef]);

	return (
		<div className="flex justify-between w-full items-center relative ">
			<AnimatePresence initial={false}>
				<form
					onSubmit={handleSubmit}
					className={`w-full items-center flex flex-col bg-card rounded-t-3xl shadow-[0px_-4px_10px_rgba(0,0,0,0.08)] ${!isMiddle ? '' : ' w-full px-0'}`}
					>
					<ChatInput
						value={input}
						ref={inputRef}
						onKeyDown={handleKeyPress}
						onChange={handleInputChange}
						name="message"
						placeholder={
							isToolInProgress
								? "Tool is in progress..."
								: "Enter your prompt here"
						}
						className="resize-none border-none dark:bg-background max-h-40 px-6 pt-6 shadow-none rounded-t-xl text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed"
						disabled={isToolInProgress}
					/>

					<div className={`flex w-full items-center dark:bg-background ${isMiddle ? 'rounded-b-lg' : 'rounded-none'}`}>
						{isLoading ? (
							<div className={`flex w-full justify-end ${!isMiddle ? 'p-4' : ''}`}>
								<div>
									<Button
										className="shrink-0 rounded-full bg-black hover:opacity-80  hover:bg-black"
										size="icon"
										type="submit"
										onClick={(e) => {
											e.preventDefault();
											stop();
										}}
									>
										<Square className="w-5 h-5" strokeWidth={2.75}/>
									</Button>
								</div>
							</div>
						) : (
							<div className={`flex w-full justify-between items-center space-x-2 ${!isMiddle ? 'p-4' : ''}`}>
								{/* Enter Shortcut Hint */}
								<span className="text-xs text-muted-foreground px-3 py-1 rounded-lg flex items-center space-x-1">
									<span>Press <span className="font-semibold">Enter</span> to send</span>
									<CornerDownLeft className="w-4 h-4" />
								</span>

								<div>


									{/* Send button */}
									<Button
										className="shrink-0 rounded-full bg-black hover:opacity-80 hover:bg-black"
										size="icon"
										type="submit"
										disabled={
											isLoading ||
											!input.trim() ||
											isToolInProgress
										}
									>
										<ArrowUp className="w-5 h-5" strokeWidth={2.75}/>
									</Button>
								</div>
							</div>
						)}
					</div>
				</form>
			</AnimatePresence>
		</div>
	);
}

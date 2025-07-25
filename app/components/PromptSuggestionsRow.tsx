import PromptSuggestionButton from "./PromptSuggestionButton"

const PromptSuggestionsRow = ({onPromptClick}) => {
    const prompts = [
        "Who is head of racing for Aston Martin's F1 Academy team?",
        "Who is the highest paid driver in F1?",
        "Who will be the newest driver for Ferrari?",
        "Who is the current Formula One World Driver's Champion?"
    ]
    return (
        <div className="prompt-suggestion-row">
            {prompts.map((prompt, index) => 
            <PromptSuggestionButton 
            key={'suggestion-${index}'}
            text={prompt}
            onClick={()=> onPromptClick(prompt)} // why not use onPromptClick(prompt) directly? the function executes right away, not when clicked
        />)}
        </div>
    )
}

export default PromptSuggestionsRow

// Home Component
// ├── handlePrompt function (the actual implementation)
// ├── passes handlePrompt as onPromptClick prop
// └── PromptSuggestionsRow
//     ├── receives onPromptClick prop (which is handlePrompt)
//     ├── passes callback to each button
//     └── PromptSuggestionButton
//         └── onClick triggers the callback chain
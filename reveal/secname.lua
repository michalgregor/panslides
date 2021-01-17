running_headings = {}

function secname_replace(blocks)
    for i, elem in ipairs(blocks) do
        if elem.text ~= nil then
            match = string.match(elem.text, "{{heading([0-9]+)}}")
            if match ~= nil then
                level = tonumber(match)
                content = running_headings[level]

                if content ~= nil then
                    blocks[i] = pandoc.Span(content)
                else
                    blocks[i].text = "!! HEADING "..level.." UNDEFINED !!"
                    print("WARNING: " .. "HEADING " .. level .. " UNDEFINED")
                end
            end
        else
            if elem.content ~= nil then
                secname_replace(elem.content)
            end

            if elem.blocks ~= nil then
                secname_replace(elem.blocks)
            end

            if elem.t == nil and elem[1].content ~= nil then
                secname_replace(elem[1].content)
            end
        end

        if elem.t == "Header" then
            running_headings[elem.level] = elem.content
        end
    end
end

function proc_doc(doc)
    secname_replace(doc.blocks)
    return doc
end

return {
    {Pandoc = proc_doc}
}
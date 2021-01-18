attr_prefix = 'data-';

function dump(o)
    if type(o) == 'table' then
       local s = '{ '
       for k,v in pairs(o) do
          if type(k) ~= 'number' then k = '"'..k..'"' end
          s = s .. '['..k..'] = ' .. dump(v) .. ','
       end
       return s .. '} '
    else
       return tostring(o)
    end
 end

function strjoin(s1, s2)
    if #s1 > 0 and #s2 > 0 then
        return s1 .. ' ' .. s2;
    else
        return s1 .. s2;
    end
end

function make_end_str(content, nil_on_unknown)
    local end_str = "";
    local i_first;

    for j = #content, 1, -1 do
        i_first = j;

        if content[j].t == "Str" or content[j].t == "RawInline" then
            end_str = content[j].text .. end_str;
        elseif content[j].t == "Quoted" then
            local qstr = '"';
            if content[j].quotetype == "SingleQuote" then
                qstr = "'";
            end
            
            inner_str, inner_j = make_end_str(content[j].content, true);
            if inner_str ~= nil then
                end_str = qstr .. inner_str .. qstr .. end_str;
            else
                if nil_on_unknown then
                    end_str = nil;
                    i_first = i_first + 1;
                    break;
                else
                    i_first = i_first + 1;
                    break;
                end
            end
        elseif content[j].t == "Space" then
            end_str = " " .. end_str;
        elseif content[j].t == "SoftBreak" then
            end_str = "\n" .. end_str;
        else
            if nil_on_unknown then
                end_str = nil;
                i_first = i_first + 1;
                break;
            else
                i_first = i_first + 1;
                break;
            end
        end
    end

    return end_str, i_first;
end

function proc_list(doc_list)
    if doc_list.t == "BulletList" then
        list_tags = {"<ul>", "</ul>"};
    else
        list_tags = {"<ol>", "</ol>"};
    end

    new_list = {pandoc.RawBlock("html", list_tags[1])};

    for i, elem in ipairs(doc_list.content) do
        local i_first;

        content = elem[1].content;
        end_str, i_first = make_end_str(content, false);

        -- separate out any leading whitespace characters
        -- from the rest of the end_str (to avoid newlines between # and
        -- the attribute brackets)
        wb, we = string.find(end_str, "%s");
        if wb == 1 then
            white_end_str = string.sub(end_str, wb, we);
            rest_end_str = string.sub(end_str, we+1);
        else
            white_end_str = "";
            rest_end_str = end_str;
        end

        rest_end_str = string.gsub(rest_end_str, "\n", " ");

        -- make the string into a title so that the attribute string
        -- at its end can be handled automatically by the markdown reader
        el = pandoc.read("# " .. rest_end_str, "markdown");
        
        -- copy out the id, classes and attributes into attr_str
        attr_str = "";

        if el.blocks[1].attr ~= nil then
            id = el.blocks[1].attr['identifier'];
            if id ~= nil then
                attr_str = attr_str .. ' id="' .. el.blocks[1].attr['identifier'] .. '"';
            end
            
            classes = el.blocks[1].attr['classes'];
            if classes ~= nil and #classes > 0 then
                classes_str = "";
                for icls, cls in pairs(classes) do
                    classes_str = strjoin(classes_str, cls);
                end

                if #classes_str > 0 then
                    attr_str = strjoin(attr_str, 'class="' .. classes_str .. '"');
                end
            end

            attributes = el.blocks[1].attr['attributes']
            if attributes ~= nil then
                for attr_key, attr_val in pairs(attributes) do
                    if attr_key ~= "style" then
                        attr_key = attr_prefix .. attr_key;
                    end

                    attr_val_escaped = string.gsub(attr_val, '"', '&quot;');
                    attr_str = strjoin(attr_str, attr_key .. '=' .. '"' .. attr_val_escaped .. '"');
                end
            end
        end

        -- insert the opening li tag
        table.insert(new_list, pandoc.RawBlock("html", "<li"..attr_str..">"));

        -- insert all the content that came before the end_str
        other_content = {}
        for i_rest = 1, i_first-1 do
            table.insert(other_content, content[i_rest]);
        end

        -- insert the content assumed by the heading
        for i_head = 1, #(el.blocks[1].content) do
            table.insert(other_content, el.blocks[1].content[i_head]);
        end

        if #other_content > 0 then
            table.insert(new_list, pandoc.Plain(other_content));
        end

        -- insert the blocks which were not assumed by the heading
        for ic = 2, #(el.blocks) do
            table.insert(new_list, el.blocks[ic]);
        end

        -- chuck in the contents of any remaining items of elem (sublists, etc.)
        for elit = 2, #elem do
            table.insert(new_list, elem[elit]);
        end

        -- table.insert(new_list, pandoc.Plain(content));
        table.insert(new_list, pandoc.RawBlock("html", "</li>"));
    end

    table.insert(new_list, pandoc.RawBlock("html", list_tags[2]));

    return new_list;
end

return {
    {
        BulletList = proc_list,
        OrderedList = proc_list
    }    
}

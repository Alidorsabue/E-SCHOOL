import 'package:flutter/material.dart';

class SearchFilterBar extends StatefulWidget {
  final String hintText;
  final Function(String)? onSearchChanged;
  final List<FilterOption>? filters;
  final Function(Map<String, dynamic>)? onFiltersChanged;
  final bool showSort;
  final List<SortOption>? sortOptions;
  final Function(String)? onSortChanged;

  const SearchFilterBar({
    super.key,
    required this.hintText,
    this.onSearchChanged,
    this.filters,
    this.onFiltersChanged,
    this.showSort = false,
    this.sortOptions,
    this.onSortChanged,
  });

  @override
  State<SearchFilterBar> createState() => _SearchFilterBarState();
}

class FilterOption {
  final String key;
  final String label;
  final List<FilterValue> values;
  final String? selectedValue;

  FilterOption({
    required this.key,
    required this.label,
    required this.values,
    this.selectedValue,
  });
}

class FilterValue {
  final String value;
  final String label;

  FilterValue({required this.value, required this.label});
}

class SortOption {
  final String value;
  final String label;

  SortOption({required this.value, required this.label});
}

class _SearchFilterBarState extends State<SearchFilterBar> {
  final TextEditingController _searchController = TextEditingController();
  final Map<String, String?> _selectedFilters = {};
  String? _selectedSort;

  @override
  void initState() {
    super.initState();
    if (widget.filters != null) {
      for (var filter in widget.filters!) {
        _selectedFilters[filter.key] = filter.selectedValue;
      }
    }
    if (widget.sortOptions != null && widget.sortOptions!.isNotEmpty) {
      _selectedSort = widget.sortOptions!.first.value;
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showFilterDialog() {
    showModalBottomSheet(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Filtres',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  TextButton(
                    onPressed: () {
                      setModalState(() {
                        _selectedFilters.clear();
                        if (widget.filters != null) {
                          for (var filter in widget.filters!) {
                            _selectedFilters[filter.key] = null;
                          }
                        }
                      });
                    },
                    child: const Text('Réinitialiser'),
                  ),
                ],
              ),
              const Divider(),
              if (widget.filters != null)
                ...widget.filters!.map((filter) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        filter.label,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: [
                          ChoiceChip(
                            label: const Text('Tous'),
                            selected: _selectedFilters[filter.key] == null,
                            onSelected: (selected) {
                              setModalState(() {
                                _selectedFilters[filter.key] = null;
                              });
                            },
                          ),
                          ...filter.values.map((value) {
                            return ChoiceChip(
                              label: Text(value.label),
                              selected: _selectedFilters[filter.key] == value.value,
                              onSelected: (selected) {
                                setModalState(() {
                                  _selectedFilters[filter.key] = selected ? value.value : null;
                                });
                              },
                            );
                          }),
                        ],
                      ),
                      const SizedBox(height: 16),
                    ],
                  );
                }),
              if (widget.showSort && widget.sortOptions != null) ...[
                const Divider(),
                const Text(
                  'Trier par',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                ...widget.sortOptions!.map((option) {
                  return RadioListTile<String>(
                    title: Text(option.label),
                    value: option.value,
                    groupValue: _selectedSort,
                    onChanged: (value) {
                      setModalState(() {
                        _selectedSort = value;
                      });
                    },
                  );
                }),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Annuler'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        widget.onFiltersChanged?.call(_selectedFilters);
                        if (widget.showSort && _selectedSort != null) {
                          widget.onSortChanged?.call(_selectedSort!);
                        }
                        Navigator.of(context).pop();
                      },
                      child: const Text('Appliquer'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Barre de recherche
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: widget.hintText,
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        widget.onSearchChanged?.call('');
                      },
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onChanged: (value) {
              widget.onSearchChanged?.call(value);
            },
          ),
          const SizedBox(height: 8),
          // Boutons filtres et tri
          Row(
            children: [
              if (widget.filters != null)
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _showFilterDialog,
                    icon: const Icon(Icons.filter_list),
                    label: const Text('Filtres'),
                  ),
                ),
              if (widget.filters != null && widget.showSort)
                const SizedBox(width: 8),
              if (widget.showSort)
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _showFilterDialog,
                    icon: const Icon(Icons.sort),
                    label: const Text('Trier'),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
